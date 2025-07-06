export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function formatPercentage(value: number): string {
  return `${Math.round(value * 100) / 100}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "text-green-600";
    case "suspended":
      return "text-red-600";
    case "deleted":
      return "text-gray-600";
    default:
      return "text-gray-600";
  }
}

export function getEmailStatusColor(status: string): string {
  switch (status) {
    case "confirmed":
      return "text-green-600";
    case "pending":
      return "text-yellow-600";
    case "expired":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}
