"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { projectsService } from "@/services/projects.service";
import type { ProjectInsert, ProjectUpdate } from "@/types/database";

export const useProjects = () =>
  useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: projectsService.list,
  });

export const useProject = (id: string) =>
  useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => projectsService.getById(id),
    enabled: !!id,
  });

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInsert) => projectsService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProjectUpdate }) =>
      projectsService.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
};
