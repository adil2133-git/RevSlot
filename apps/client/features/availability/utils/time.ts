import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

// Accepts flexible manual input: "9am", "9:15 PM", "21:00", etc.
const PARSE_FORMATS = ["h:mm A", "h:mmA", "h A", "hA", "HH:mm", "H:mm", "h a", "ha"];

// Backend may return "HH:MM:SS" — normalize to "HH:MM"
export function normalizeTime(time: string): string {
  return time.slice(0, 5);
}

export function formatDisplayTime(time24: string): string {
  const parsed = dayjs(normalizeTime(time24), "HH:mm");
  return parsed.isValid() ? parsed.format("hh:mm A") : time24;
}

export function parseManualTime(input: string): string | null {
  const parsed = dayjs(input.trim(), PARSE_FORMATS, true);
  return parsed.isValid() ? parsed.format("HH:mm") : null;
}