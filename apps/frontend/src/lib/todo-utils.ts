import { format, parseISO } from "date-fns";

export function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatDisplayDate(dateStr: string): string {
  return format(parseISO(dateStr), "EEEE, MMMM d, yyyy");
}
