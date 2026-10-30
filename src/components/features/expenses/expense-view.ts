import type { ServiceTotals } from "@/lib/expense-review";
import type { DismissedSet, RemarkMap } from "@/services/expense-review.service";
import type { ServiceWithProjects } from "@/services/expense-services.service";
import type { Expense, Project } from "@/types/database";

/** Everything the expense tabs read, loaded once by ExpensesManager. */
export type ExpenseView = {
  charges: Expense[];
  services: ServiceWithProjects[];
  /** Every month on record, oldest first. */
  months: string[];
  firstMonth: string;
  latest: string;
  totals: ServiceTotals;
  remarks: RemarkMap;
  /** Increases marked "no remark needed". */
  dismissed: DismissedSet;
  projects: Project[];
  projectById: Map<string, Project>;
};

export const UNCATEGORIZED = "Uncategorized";
export const categoryName = (service: ServiceWithProjects) => service.category?.trim() || UNCATEGORIZED;
