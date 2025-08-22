
export const toNumber = (value: number | string | null | undefined): number => {
  if (typeof value === 'number') return isFinite(value) ? value : 0;
  if (value == null) return 0;
  const cleaned = String(value).replace(/\./g, '').replace(',', '.'); // suporta "59,90" e "59.90"
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatBRL = (value: number | string | null | undefined): string => {
  const n = toNumber(value);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
