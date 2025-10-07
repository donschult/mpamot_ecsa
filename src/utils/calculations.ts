import { ECSA_DATA, TableDefinition } from '../data/ecsa';

export type FeeComputation = {
  tableId: string;
  tableName: string;
  cost: number;
  primary: number;
  secondary: number;
  basic: number;
  factors: string[];
  adjustmentFactor: number;
  discount: number;
  discountedFee: number;
  note?: string;
};

export type StageBreakdown = Record<string, number>;

export type CalculationResult = {
  categories: Record<string, FeeComputation>;
  totals: {
    undiscounted: number;
    discounted: number;
    overallDiscount: number;
  };
  stages: Record<string, StageBreakdown>;
};

const MIN_COST = 1_000_000;

const findBracket = (table: TableDefinition, cost: number) =>
  table.brackets.find((bracket) => cost >= bracket.min && cost < bracket.max);

const computeFee = (table: TableDefinition, cost: number) => {
  if (cost < MIN_COST) {
    return {
      primary: 0,
      secondary: 0,
      basic: 0,
      note: 'Projects under R1,000,000 should be negotiated on a lump sum or time basis.'
    };
  }

  const bracket = findBracket(table, cost);
  if (!bracket) {
    return {
      primary: 0,
      secondary: 0,
      basic: 0,
      note: 'Cost falls outside of the configured brackets.'
    };
  }

  const primary = bracket.primary;
  const secondary = (cost - bracket.min) * (bracket.secondary / 100);
  const basic = primary + secondary;

  return { primary, secondary, basic };
};

const resolveFactorList = (tableId: string, selected: string[]): string[] => {
  if (!selected.length) {
    return [];
  }

  if (tableId === '1' || tableId === '2') {
    const table = ECSA_DATA.factors['2A'] ?? [];
    return selected.filter((name) => table.some((factor) => factor.name === name));
  }

  const factorTable = ECSA_DATA.factors[`${tableId}A`] ?? [];
  return selected.filter((name) => factorTable.some((factor) => factor.name === name));
};

export type CalculationInputs = {
  inputMethod: 'total' | 'category';
  totalCost: number;
  percentages: Record<string, number>;
  categoryCosts: Record<string, number>;
  discounts: Record<string, number>;
  selectedFactors: Record<string, string[]>;
};

export const calculateFees = ({
  inputMethod,
  totalCost,
  percentages,
  categoryCosts,
  discounts,
  selectedFactors
}: CalculationInputs): CalculationResult => {
  const categories: Record<string, FeeComputation> = {};
  let totalUndiscounted = 0;
  let totalDiscounted = 0;

  Object.values(ECSA_DATA.tables).forEach((table) => {
    const cost = inputMethod === 'total' ? (totalCost * (percentages[table.id] ?? 0)) / 100 : categoryCosts[table.id] ?? 0;

    if (!cost) {
      return;
    }

    const fee = computeFee(table, cost);

    const selection = resolveFactorList(table.id, selectedFactors[table.id] ?? []);
    const adjustmentFactor = selection.reduce((acc, name) => {
      const factor = (table.id === '1' || table.id === '2' ? ECSA_DATA.factors['2A'] : ECSA_DATA.factors[`${table.id}A`])?.find(
        (item) => item.name === name
      );
      return factor ? acc * factor.factor : acc;
    }, 1);

    const adjustedFee = fee.basic * adjustmentFactor;
    const discount = discounts[table.id] ?? 0;
    const discountedFee = adjustedFee * (1 - discount / 100);

    categories[table.id] = {
      tableId: table.id,
      tableName: table.name,
      cost,
      primary: fee.primary,
      secondary: fee.secondary,
      basic: fee.basic,
      factors: selection,
      adjustmentFactor,
      discount,
      discountedFee,
      note: fee.note
    };

    totalUndiscounted += adjustedFee;
    totalDiscounted += discountedFee;
  });

  const stages: Record<string, StageBreakdown> = {};
  Object.values(categories).forEach((category) => {
    const stageKey = ECSA_DATA.tableStageMap[category.tableId];
    const stageDefinition = ECSA_DATA.stages[stageKey];
    const stageBreakdown: StageBreakdown = {};

    Object.entries(stageDefinition).forEach(([stageName, percentage]) => {
      stageBreakdown[stageName] = (category.discountedFee * percentage) / 100;
    });

    stages[category.tableId] = stageBreakdown;
  });

  const totals = {
    undiscounted: totalUndiscounted,
    discounted: totalDiscounted,
    overallDiscount: totalUndiscounted
      ? ((totalUndiscounted - totalDiscounted) / totalUndiscounted) * 100
      : 0
  };

  return { categories, stages, totals };
};
