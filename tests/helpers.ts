export function calcStatus(total: number, advance: number): 'PENDING' | 'PARTIAL' | 'PAID' {
  const balance = Math.max(0, total - advance);
  if (balance <= 0 && total > 0) return 'PAID';
  if (advance > 0 && balance > 0) return 'PARTIAL';
  return 'PENDING';
}
