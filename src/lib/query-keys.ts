import type { TaskFilters } from "@/services/tasks.service";

// Centralised query keys so invalidation stays consistent across hooks.
export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    user: () => [...queryKeys.auth.all, "user"] as const,
  },
  projects: {
    all: ["projects"] as const,
    list: () => [...queryKeys.projects.all, "list"] as const,
    detail: (id: string) => [...queryKeys.projects.all, "detail", id] as const,
  },
  people: {
    all: ["people"] as const,
    list: () => [...queryKeys.people.all, "list"] as const,
    page: (params: { page: number; pageSize: number; role: string | null; employmentType: string | null }) =>
      [...queryKeys.people.all, "page", params] as const,
  },
  allocations: {
    all: ["allocations"] as const,
    list: () => [...queryKeys.allocations.all, "list"] as const,
  },
  wbs: {
    all: ["wbs"] as const,
    list: (projectId: string) => [...queryKeys.wbs.all, "list", projectId] as const,
    listAll: () => [...queryKeys.wbs.all, "list-all"] as const,
  },
  risks: {
    all: ["risks"] as const,
    list: (projectId: string) => [...queryKeys.risks.all, "list", projectId] as const,
    dismissed: (projectId: string) => [...queryKeys.risks.all, "dismissed", projectId] as const,
  },
  issues: {
    all: ["issues"] as const,
    list: (projectId: string) => [...queryKeys.issues.all, "list", projectId] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    list: () => [...queryKeys.expenses.all, "list"] as const,
    services: () => [...queryKeys.expenses.all, "services"] as const,
    remarks: () => [...queryKeys.expenses.all, "remarks"] as const,
    sent: () => [...queryKeys.expenses.all, "sent"] as const,
  },
  ai: {
    all: ["ai"] as const,
    health: () => [...queryKeys.ai.all, "health"] as const,
  },
  jira: {
    all: ["jira"] as const,
    health: () => [...queryKeys.jira.all, "health"] as const,
    boards: () => [...queryKeys.jira.all, "boards"] as const,
    sprintReport: (boardId: number, sprintId: number | null) =>
      [...queryKeys.jira.all, "sprint-report", boardId, sprintId] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    list: (filters: TaskFilters = {}) => [...queryKeys.tasks.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.tasks.all, "detail", id] as const,
  },
};
