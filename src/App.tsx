import { useMemo, useState } from 'react';
import { Calculator, CheckCircle2, Download, FileText, Settings } from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { ECSA_DATA, MIN_PROJECT_VALUE } from './data/ecsa';
import { calculateFees, CalculationResult } from './utils/calculations';
import { formatCurrency, formatPercent, parseNumber } from './utils/format';
import './App.css';

type TabKey = 'inputs' | 'results' | 'reference';

type StringRecord = Record<string, string>;

const createEmptyRecord = (): StringRecord => {
  const record: StringRecord = {};
  Object.keys(ECSA_DATA.tables).forEach((key) => {
    record[key] = '';
  });
  return record;
};

const getFactorOptions = (tableId: string) => {
  if (tableId === '1' || tableId === '2') {
    return ECSA_DATA.factors['2A'] ?? [];
  }
  return ECSA_DATA.factors[`${tableId}A`] ?? [];
};

const App = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('inputs');
  const [inputMethod, setInputMethod] = useState<'total' | 'category'>('total');
  const [totalCost, setTotalCost] = useState('');
  const [percentages, setPercentages] = useState<StringRecord>(() => createEmptyRecord());
  const [categoryCosts, setCategoryCosts] = useState<StringRecord>(() => createEmptyRecord());
  const [discounts, setDiscounts] = useState<StringRecord>(() => createEmptyRecord());
  const [selectedFactors, setSelectedFactors] = useState<Record<string, string[]>>({});
  const [results, setResults] = useState<CalculationResult | null>(null);

  const totalPercentage = useMemo(
    () =>
      Object.values(percentages).reduce((acc, value) => acc + (value ? Number(value) : 0), 0),
    [percentages]
  );

  const activeTables = useMemo(() => {
    if (inputMethod === 'total') {
      return Object.keys(percentages).filter((key) => Number(percentages[key] || 0) > 0);
    }
    return Object.keys(categoryCosts).filter((key) => Number(categoryCosts[key] || 0) > 0);
  }, [categoryCosts, inputMethod, percentages]);

  const resetForm = () => {
    setPercentages(createEmptyRecord());
    setCategoryCosts(createEmptyRecord());
    setDiscounts(createEmptyRecord());
    setSelectedFactors({});
    setTotalCost('');
    setResults(null);
    setActiveTab('inputs');
  };

  const handleToggleFactor = (tableId: string, factorName: string) => {
    setSelectedFactors((prev) => {
      const current = prev[tableId] ?? [];
      const exists = current.includes(factorName);
      return {
        ...prev,
        [tableId]: exists ? current.filter((name) => name !== factorName) : [...current, factorName]
      };
    });
  };

  const handleCalculate = () => {
    const numericTotal = parseNumber(totalCost);
    const numericPercentages: Record<string, number> = {};
    const numericCategoryCosts: Record<string, number> = {};
    const numericDiscounts: Record<string, number> = {};

    Object.keys(ECSA_DATA.tables).forEach((key) => {
      numericPercentages[key] = Number(percentages[key] || 0);
      numericCategoryCosts[key] = parseNumber(categoryCosts[key] || '');
      numericDiscounts[key] = Number(discounts[key] || 0);
    });

    const calculation = calculateFees({
      inputMethod,
      totalCost: numericTotal,
      percentages: numericPercentages,
      categoryCosts: numericCategoryCosts,
      discounts: numericDiscounts,
      selectedFactors
    });

    setResults(calculation);
    setActiveTab('results');
  };

  const canCalculate = useMemo(() => {
    if (inputMethod === 'total') {
      return totalCost && Math.abs(totalPercentage - 100) < 0.01;
    }
    return activeTables.length > 0;
  }, [activeTables.length, inputMethod, totalCost, totalPercentage]);

  const exportToExcel = () => {
    if (!results) return;

    const workbook = XLSX.utils.book_new();

    const inputsSheet = [
      ['ECSA Fee Calculator Inputs'],
      ['Guideline: Government Gazette No. 52691 (16 May 2025)'],
      [''],
      ['Input method', inputMethod === 'total' ? 'Total project cost with percentages' : 'Direct category cost capture'],
      ['Total project cost', totalCost ? formatCurrency(parseNumber(totalCost)) : 'Not specified'],
      [''],
      ['Category allocations']
    ];

    Object.values(ECSA_DATA.tables).forEach((table) => {
      const cost =
        inputMethod === 'total'
          ? parseNumber(totalCost || '0') * (Number(percentages[table.id] || 0) / 100)
          : parseNumber(categoryCosts[table.id] || '0');

      inputsSheet.push([
        `${table.id}: ${table.name}`,
        inputMethod === 'total' ? `${Number(percentages[table.id] || 0)}%` : '',
        cost ? formatCurrency(cost) : 'R 0.00'
      ]);
    });

    const inputsWorksheet = XLSX.utils.aoa_to_sheet(inputsSheet);
    XLSX.utils.book_append_sheet(workbook, inputsWorksheet, 'Inputs');

    const calcSheet = [
      [
        'Table',
        'Allocated Cost',
        'Primary Fee',
        'Secondary Fee',
        'Basic Fee',
        'Adjustment Factor',
        'Discount %',
        'Final Fee',
        'Applied Factors'
      ]
    ];

    Object.values(results.categories).forEach((category) => {
      calcSheet.push([
        `${category.tableId}: ${category.tableName}`,
        formatCurrency(category.cost),
        formatCurrency(category.primary),
        formatCurrency(category.secondary),
        formatCurrency(category.basic),
        category.adjustmentFactor.toFixed(3),
        `${category.discount.toFixed(2)}%`,
        formatCurrency(category.discountedFee),
        category.factors.join(', ') || 'None'
      ]);
    });

    const calcWorksheet = XLSX.utils.aoa_to_sheet(calcSheet);
    XLSX.utils.book_append_sheet(workbook, calcWorksheet, 'Calculations');

    const stageSheet = [['Table', 'Stage', 'Percentage', 'Amount']];
    Object.entries(results.stages).forEach(([tableId, breakdown]) => {
      const stageDefinition = ECSA_DATA.stages[ECSA_DATA.tableStageMap[tableId]];
      Object.entries(breakdown).forEach(([stageName, amount]) => {
        stageSheet.push([
          tableId,
          stageName,
          `${stageDefinition[stageName]}%`,
          formatCurrency(amount)
        ]);
      });
    });
    const stageWorksheet = XLSX.utils.aoa_to_sheet(stageSheet);
    XLSX.utils.book_append_sheet(workbook, stageWorksheet, 'Stages');

    XLSX.writeFile(workbook, 'ecsa-fee-calculation.xlsx');
  };

  const exportToPdf = () => {
    if (!results) return;

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = margin;

    const addHeading = (text: string, size = 16) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(size);
      doc.text(text, margin, y);
      y += 24;
    };

    const ensureSpace = (height: number) => {
      if (y + height > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    doc.setTextColor('#1d4ed8');
    addHeading('ECSA Fee Calculation Report', 20);
    doc.setTextColor('#475569');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Guideline: Government Gazette No. 52691 (16 May 2025)', margin, y);
    y += 12;
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 20;

    const summaryTile = (label: string, value: string) => {
      doc.setDrawColor('#dbeafe');
      doc.setFillColor('#eff6ff');
      doc.roundedRect(margin, y, pageWidth - margin * 2, 44, 6, 6, 'FD');
      doc.setTextColor('#1d4ed8');
      doc.setFontSize(11);
      doc.text(label, margin + 12, y + 18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(value, margin + 12, y + 34);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor('#475569');
      y += 56;
    };

    summaryTile('Total undiscounted professional fee', formatCurrency(results.totals.undiscounted));
    summaryTile('Total discounted professional fee', formatCurrency(results.totals.discounted));
    summaryTile('Overall discount achieved', formatPercent(results.totals.overallDiscount));

    addHeading('Detailed fee breakdown', 14);

    Object.values(results.categories).forEach((category) => {
      ensureSpace(140);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor('#1d4ed8');
      doc.text(`${category.tableId}: ${category.tableName}`, margin, y);
      y += 16;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor('#0f172a');
      const metrics = [
        ['Allocated cost', formatCurrency(category.cost)],
        ['Primary fee', formatCurrency(category.primary)],
        ['Secondary fee', formatCurrency(category.secondary)],
        ['Basic fee', formatCurrency(category.basic)],
        ['Adjustment factor', category.adjustmentFactor.toFixed(3)],
        ['Discount applied', formatPercent(category.discount)],
        ['Final fee', formatCurrency(category.discountedFee)]
      ];

      metrics.forEach(([label, value]) => {
        doc.text(`${label}: ${value}`, margin, y);
        y += 14;
      });

      if (category.factors.length) {
        doc.setTextColor('#475569');
        doc.text(`Factors applied: ${category.factors.join(', ')}`, margin, y);
        y += 14;
      }

      if (category.note) {
        doc.setTextColor('#b91c1c');
        doc.text(category.note, margin, y, { maxWidth: pageWidth - margin * 2 });
        y += 14;
      }

      const stageDefinition = ECSA_DATA.stages[ECSA_DATA.tableStageMap[category.tableId]];
      doc.setTextColor('#1d4ed8');
      doc.setFont('helvetica', 'bold');
      doc.text('Stage allocation', margin, y);
      y += 16;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor('#0f172a');
      Object.entries(results.stages[category.tableId]).forEach(([stageName, amount]) => {
        doc.text(
          `${stageName} (${stageDefinition[stageName]}%): ${formatCurrency(amount)}`,
          margin,
          y
        );
        y += 14;
      });

      y += 12;
    });

    doc.save('ecsa-fee-calculation.pdf');
  };

  return (
    <div className="app-shell">
      <header className="header">
        <h1>ECSA Professional Fee Calculator</h1>
        <p>
          Calculate professional fees in line with the Engineering Council of South Africa (ECSA)
          guideline for 2025. Capture your project assumptions, apply relevant adjustment factors, and
          export the results for record keeping.
        </p>
      </header>

      <main className="content">
        <div className="tab-bar">
          <button
            className={`tab-button ${activeTab === 'inputs' ? 'active' : ''}`}
            onClick={() => setActiveTab('inputs')}
          >
            <Calculator />
            Inputs
          </button>
          <button
            className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => results && setActiveTab('results')}
            disabled={!results}
            style={!results ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
          >
            <CheckCircle2 />
            Results
          </button>
          <button
            className={`tab-button ${activeTab === 'reference' ? 'active' : ''}`}
            onClick={() => setActiveTab('reference')}
          >
            <FileText />
            Reference
          </button>
        </div>

        {activeTab === 'inputs' && (
          <section>
            <div className="section-title">
              <Settings />
              Calculation setup
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="field-group">
                <label>How would you like to provide project costs?</label>
                <div className="radio-toggle">
                  <button
                    type="button"
                    className={inputMethod === 'total' ? 'active' : ''}
                    onClick={() => setInputMethod('total')}
                  >
                    Total project value
                  </button>
                  <button
                    type="button"
                    className={inputMethod === 'category' ? 'active' : ''}
                    onClick={() => setInputMethod('category')}
                  >
                    Capture per table
                  </button>
                </div>
                {inputMethod === 'total' && (
                  <>
                    <label htmlFor="totalCost">Total project construction cost (ZAR)</label>
                    <input
                      id="totalCost"
                      placeholder="e.g. 25 000 000"
                      value={totalCost}
                      onChange={(event) => setTotalCost(event.target.value)}
                      inputMode="decimal"
                    />
                    <small>
                      Projects below {formatCurrency(MIN_PROJECT_VALUE)} should be negotiated on a lump sum or
                      time basis per the guideline.
                    </small>
                    <small>Total allocation: {totalPercentage.toFixed(2)}%</small>
                    {Math.abs(totalPercentage - 100) > 0.01 && (
                      <small style={{ color: '#b91c1c' }}>
                        Ensure the allocation equals 100% before calculating.
                      </small>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="input-grid">
              {Object.values(ECSA_DATA.tables).map((table) => {
                const factorOptions = getFactorOptions(table.id);
                const selected = selectedFactors[table.id] ?? [];
                return (
                  <div className="card" key={table.id}>
                    <h3>{table.name}</h3>
                    <div className="field-group">
                      {inputMethod === 'total' ? (
                        <>
                          <label htmlFor={`percentage-${table.id}`}>Allocation percentage</label>
                          <input
                            id={`percentage-${table.id}`}
                            placeholder="0"
                            value={percentages[table.id]}
                            onChange={(event) =>
                              setPercentages((prev) => ({ ...prev, [table.id]: event.target.value }))
                            }
                            inputMode="decimal"
                          />
                        </>
                      ) : (
                        <>
                          <label htmlFor={`cost-${table.id}`}>Allocated cost (ZAR)</label>
                          <input
                            id={`cost-${table.id}`}
                            placeholder="0"
                            value={categoryCosts[table.id]}
                            onChange={(event) =>
                              setCategoryCosts((prev) => ({ ...prev, [table.id]: event.target.value }))
                            }
                            inputMode="decimal"
                          />
                        </>
                      )}

                      {factorOptions.length > 0 && (
                        <div>
                          <label>Applicable adjustment factors</label>
                          <div className="factor-tags">
                            {factorOptions.map((factor) => {
                              const isSelected = selected.includes(factor.name);
                              return (
                                <button
                                  key={factor.name}
                                  type="button"
                                  onClick={() => handleToggleFactor(table.id, factor.name)}
                                  className="factor-tag"
                                  style={{
                                    background: isSelected ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37,99,235,0.08)',
                                    color: isSelected ? '#1d4ed8' : '#2563eb',
                                    border: isSelected ? '1px solid rgba(37,99,235,0.3)' : '1px solid transparent'
                                  }}
                                >
                                  {factor.name}
                                  <span style={{ fontWeight: 400, marginLeft: 4 }}>×{factor.factor}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <label htmlFor={`discount-${table.id}`}>Discount (%)</label>
                      <input
                        id={`discount-${table.id}`}
                        placeholder="0"
                        value={discounts[table.id]}
                        onChange={(event) =>
                          setDiscounts((prev) => ({ ...prev, [table.id]: event.target.value }))
                        }
                        inputMode="decimal"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="button-row">
              <button className="secondary-button" type="button" onClick={resetForm}>
                Reset inputs
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={handleCalculate}
                disabled={!canCalculate}
                style={!canCalculate ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
              >
                <Calculator />
                Calculate fees
              </button>
            </div>
          </section>
        )}

        {activeTab === 'results' && results && (
          <section>
            <div className="section-title">
              <CheckCircle2 />
              Calculation results
            </div>

            <div className="summary-tiles">
              <div className="summary-tile">
                <h4>Total undiscounted fee</h4>
                <span>{formatCurrency(results.totals.undiscounted)}</span>
              </div>
              <div className="summary-tile">
                <h4>Total discounted fee</h4>
                <span>{formatCurrency(results.totals.discounted)}</span>
              </div>
              <div className="summary-tile">
                <h4>Overall discount</h4>
                <span>{formatPercent(results.totals.overallDiscount)}</span>
              </div>
            </div>

            <div className="results-grid">
              {activeTables.map((tableId) => {
                const category = results.categories[tableId];
                if (!category) return null;
                const stages = results.stages[tableId];
                const stageDefinition = ECSA_DATA.stages[ECSA_DATA.tableStageMap[tableId]];

                return (
                  <div className="card result-card" key={tableId}>
                    <h4>{category.tableName}</h4>
                    <div className="metric">
                      <label>Allocated cost</label>
                      <span>{formatCurrency(category.cost)}</span>
                    </div>
                    <div className="metric">
                      <label>Primary fee</label>
                      <span>{formatCurrency(category.primary)}</span>
                    </div>
                    <div className="metric">
                      <label>Secondary fee</label>
                      <span>{formatCurrency(category.secondary)}</span>
                    </div>
                    <div className="metric">
                      <label>Basic fee</label>
                      <span>{formatCurrency(category.basic)}</span>
                    </div>
                    <div className="metric">
                      <label>Adjustment factor</label>
                      <span>{category.adjustmentFactor.toFixed(3)}</span>
                    </div>
                    <div className="metric">
                      <label>Discount</label>
                      <span>{formatPercent(category.discount)}</span>
                    </div>
                    <div className="metric">
                      <label>Final fee</label>
                      <span>{formatCurrency(category.discountedFee)}</span>
                    </div>

                    {category.factors.length > 0 && (
                      <div className="factor-tags">
                        {category.factors.map((factor) => (
                          <span key={factor} className="factor-tag">
                            {factor}
                          </span>
                        ))}
                      </div>
                    )}

                    {category.note && <small style={{ color: '#b91c1c' }}>{category.note}</small>}

                    <table className="stage-table">
                      <thead>
                        <tr>
                          <th>Stage</th>
                          <th>Percent</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(stages).map(([stageName, amount]) => (
                          <tr key={stageName}>
                            <td>{stageName}</td>
                            <td>{formatPercent(stageDefinition[stageName])}</td>
                            <td>{formatCurrency(amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>

            <div className="button-row">
              <button className="secondary-button" type="button" onClick={exportToExcel}>
                <Download /> Export to Excel
              </button>
              <button className="primary-button" type="button" onClick={exportToPdf}>
                <Download /> Export to PDF
              </button>
            </div>
          </section>
        )}

        {activeTab === 'reference' && (
          <section className="reference-section">
            <div className="section-title">
              <FileText />
              Guideline highlights
            </div>

            <div className="card reference-card">
              <h3>Using the calculator</h3>
              <ul>
                <li>
                  The calculator enforces a minimum project value of {formatCurrency(MIN_PROJECT_VALUE)} in
                  line with the ECSA guidance for negotiating smaller projects on a different basis.
                </li>
                <li>
                  Adjustment factors can be combined; the multiplier applied is the product of the selected
                  factors.
                </li>
                <li>Discounts are applied after adjustment factors for a transparent audit trail.</li>
              </ul>
            </div>

            <div className="card reference-card">
              <h3>Stage distribution reminder</h3>
              <ul>
                <li>
                  Civil engineering projects distribute fees across six stages, with concept and design
                  development receiving the highest weighting.
                </li>
                <li>
                  Structural projects emphasise design development (30%) while building projects allocate a
                  higher share to documentation.
                </li>
                <li>
                  Mechanical and electrical projects reserve 35% for contract administration and inspection.
                </li>
              </ul>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
