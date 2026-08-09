export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 }).format(value / 1_000_000)} م`;
  }
  if (value >= 1_000) {
    return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 }).format(value / 1_000)} هـ`;
  }
  return new Intl.NumberFormat("fa-IR").format(value);
}

export function toPersianDate(isoDate: string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}
