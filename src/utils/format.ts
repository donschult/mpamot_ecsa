export const formatCurrency = (value: number): string =>
  `R ${value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatPercent = (value: number): string =>
  `${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;

export const parseNumber = (value: string): number => {
  const normalized = value.replace(/[^0-9.-]+/g, '');
  return normalized ? Number(normalized) : 0;
};
