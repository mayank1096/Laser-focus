/** ISO `YYYY-MM` for the month `offset` months after `from`. */
export function addMonths(from: Date, offset: number): string {
  const d = new Date(from.getFullYear(), from.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
