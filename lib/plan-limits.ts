import type { SubscriptionPlan } from "@/types/database";

type PlanLimits = {
  stores: number;
  teachers: number;
  students: number;
  resourcesPerBook: number;
};

/** -1 = 無制限 */
export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: { stores: 0, teachers: 0, students: 0, resourcesPerBook: 0 },
  pro: { stores: 1, teachers: 3, students: 50, resourcesPerBook: 3 },
  team: { stores: 1, teachers: -1, students: -1, resourcesPerBook: -1 },
} as const;

/** Team プランの追加校舎単価 (円) */
export const EXTRA_STORE_PRICE = 10_000;

/** team の max_stores = 1 + extra_stores */
export function getMaxStores(plan: SubscriptionPlan, extraStores: number): number {
  if (plan === "team") return PLAN_LIMITS.team.stores + extraStores;
  return PLAN_LIMITS[plan].stores;
}

export function isWithinLimit(limit: number, current: number): boolean {
  if (limit === -1) return true;
  return current < limit;
}
