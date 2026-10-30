"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { tasksService, type TaskFilters } from "@/services/tasks.service";
import type { TaskInsert, TaskUpdate } from "@/types/database";

export const useTasks = (filters: TaskFilters = {}) =>
  useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: () => tasksService.list(filters),
  });

export const useTask = (id: string) =>
  useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => tasksService.getById(id),
    enabled: !!id,
  });

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskInsert) => tasksService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskUpdate }) =>
      tasksService.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  });
};
