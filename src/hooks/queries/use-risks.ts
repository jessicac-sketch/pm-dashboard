"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { issuesService } from "@/services/issues.service";
import { risksService } from "@/services/risks.service";
import type { IssueInsert, IssueUpdate, Risk, RiskInsert, RiskUpdate } from "@/types/database";

export const useRisks = (projectId: string) =>
  useQuery({
    queryKey: queryKeys.risks.list(projectId),
    queryFn: () => risksService.listByProject(projectId),
    enabled: !!projectId,
  });

export const useDismissedSuggestions = (projectId: string) =>
  useQuery({
    queryKey: queryKeys.risks.dismissed(projectId),
    queryFn: () => risksService.listDismissedSuggestions(projectId),
    enabled: !!projectId,
  });

export const useIssues = (projectId: string) =>
  useQuery({
    queryKey: queryKeys.issues.list(projectId),
    queryFn: () => issuesService.listByProject(projectId),
    enabled: !!projectId,
  });

export const useCreateRisk = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RiskInsert) => risksService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.risks.list(projectId) }),
  });
};

export const useUpdateRisk = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RiskUpdate }) => risksService.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.risks.list(projectId) }),
  });
};

export const useDismissSuggestion = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (suggestionKey: string) => risksService.dismissSuggestion(projectId, suggestionKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.risks.dismissed(projectId) }),
  });
};

export const useCreateIssue = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IssueInsert) => issuesService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(projectId) }),
  });
};

export const useUpdateIssue = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: IssueUpdate }) => issuesService.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(projectId) }),
  });
};

/** "It happened": log an issue from the risk, then close the risk. */
export const useConvertRiskToIssue = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ risk, issue }: { risk: Risk; issue: IssueInsert }) => {
      await issuesService.create(issue);
      await risksService.update(risk.id, { status: "closed" });
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.risks.list(projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(projectId) }),
      ]),
  });
};
