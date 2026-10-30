"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { jiraService } from "@/services/jira.service";

/** Jira data changes all day; cache briefly so switching tabs doesn't refetch every time. */
const JIRA_STALE_MS = 2 * 60 * 1000;

export const useJiraHealth = () =>
  useQuery({
    queryKey: queryKeys.jira.health(),
    queryFn: jiraService.health,
    staleTime: 10 * 60 * 1000,
  });

export const useJiraBoards = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.jira.boards(),
    queryFn: jiraService.boards,
    staleTime: 10 * 60 * 1000,
    enabled,
  });

/** `sprintId` null means the board's current sprint. */
export const useSprintReport = (boardId: number, sprintId: number | null) =>
  useQuery({
    queryKey: queryKeys.jira.sprintReport(boardId, sprintId),
    queryFn: () => jiraService.sprintReport(boardId, sprintId),
    staleTime: JIRA_STALE_MS,
  });
