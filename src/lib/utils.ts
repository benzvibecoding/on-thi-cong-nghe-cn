export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Round to 2 decimals for score display (e.g. 7.35). */
export function formatScore(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

/** Remove Vietnamese diacritics for accent-insensitive search (S5 groundwork). */
export function removeVietnameseAccents(input: string): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}
