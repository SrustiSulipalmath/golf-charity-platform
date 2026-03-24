// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatPence(pence: number): string {
  return formatCurrency(pence / 100);
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateShort(date: string | Date): string {
  return format(new Date(date), "dd/MM/yy");
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getMonthName(month: number): string {
  return format(new Date(2024, month - 1, 1), "MMMM");
}

export function pluralise(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? singular + "s");
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const PRIZE_TIER_LABELS: Record<string, string> = {
  five_match: "Jackpot (5 Match)",
  four_match: "4 Number Match",
  three_match: "3 Number Match",
};

export const STATUS_COLORS: Record<string, string> = {
  active:   "text-green-400 bg-green-400/10",
  inactive: "text-zinc-400 bg-zinc-400/10",
  cancelled: "text-red-400 bg-red-400/10",
  lapsed:   "text-orange-400 bg-orange-400/10",
  pending:  "text-yellow-400 bg-yellow-400/10",
  approved: "text-green-400 bg-green-400/10",
  rejected: "text-red-400 bg-red-400/10",
  paid:     "text-emerald-400 bg-emerald-400/10",
};
