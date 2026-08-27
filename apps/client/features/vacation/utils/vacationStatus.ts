import dayjs from "dayjs";

export type VacationStatus = "active" | "upcoming" | "past";

export function getVacationStatus(startDate: string, endDate: string): VacationStatus {
  const today = dayjs().format("YYYY-MM-DD");

  if (today > endDate) return "past";
  if (today >= startDate && today <= endDate) return "active";
  return "upcoming";
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  if (start.year() === end.year()) {
    return `${start.format("MMM D")} – ${end.format("MMM D, YYYY")}`;
  }
  return `${start.format("MMM D, YYYY")} – ${end.format("MMM D, YYYY")}`;
}