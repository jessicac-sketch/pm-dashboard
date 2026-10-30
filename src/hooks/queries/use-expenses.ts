"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { expenseReviewService } from "@/services/expense-review.service";
import { expenseServicesService } from "@/services/expense-services.service";
import { expensesService } from "@/services/expenses.service";
import type { ExpenseInsert, ExpenseServiceUpdate } from "@/types/database";

export const useExpenses = () => useQuery({ queryKey: queryKeys.expenses.list(), queryFn: expensesService.list });
export const useExpenseServices = () => useQuery({ queryKey: queryKeys.expenses.services(), queryFn: expenseServicesService.list });
export const useExpenseRemarks = () => useQuery({ queryKey: queryKeys.expenses.remarks(), queryFn: expenseReviewService.listRemarks });
export const useSentReports = () => useQuery({ queryKey: queryKeys.expenses.sent(), queryFn: expenseReviewService.listSent });

/** Everything under "expenses" (charges, services, remarks, sent state). */
const useInvalidateAll = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
};

export const useImportExpenses = () => {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (rows: ExpenseInsert[]) => expensesService.importMany(rows), onSuccess: invalidate });
};

/** Gives any charge without a service one (creates services for new statement lines). */
export const useAssignServices = () => {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: expensesService.assignServices, onSuccess: invalidate });
};

export const useUpdateService = () => {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, input, projectIds }: { id: string; input: ExpenseServiceUpdate; projectIds?: string[] }) =>
      expenseServicesService.update(id, input, projectIds),
    onSuccess: invalidate,
  });
};

export const useMergeService = () => {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ sourceId, targetId }: { sourceId: string; targetId: string }) => expenseServicesService.mergeInto(sourceId, targetId),
    onSuccess: invalidate,
  });
};

export const useSaveRemark = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, month, remark }: { serviceId: string; month: string; remark: string }) =>
      expenseReviewService.saveRemark(serviceId, month, remark),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.expenses.remarks() }),
  });
};

export const useSetRemarkDismissed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, month, dismissed }: { serviceId: string; month: string; dismissed: boolean }) =>
      expenseReviewService.setDismissed(serviceId, month, dismissed),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.expenses.remarks() }),
  });
};

export const useSetReportSent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ month, sent }: { month: string; sent: boolean }) => expenseReviewService.setSent(month, sent),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.expenses.sent() }),
  });
};
