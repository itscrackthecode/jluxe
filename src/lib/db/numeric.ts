export function formatNumericValue(value: string | null) {
  if (value === null) return null;

  const normalized = value
    .replace(/(\.\d*?[1-9])0+$/, '$1')
    .replace(/\.0+$/, '');

  return /^-?0(?:\.0*)?$/.test(normalized) ? '0' : normalized;
}