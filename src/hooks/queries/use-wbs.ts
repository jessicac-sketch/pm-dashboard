"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { wbsService } from "@/services/wbs.service";
import type { WbsItemInsert, WbsItemUpdate } from "@/types/database";

export const useWbs = (projectId: string) =>
  useQuery({
    queryKey: queryKeys.wbs.list(projectId),
    queryFn: () => wbsService.listByProject(projectId),
    enabled: !!projectId,
  });

/** WBS items for every project (the dashboard rolls them up per project). */
export const useAllWbsItems = () =>
  useQuery({
    queryKey: queryKeys.wbs.listAll(),
    queryFn: wbsService.listAll,
  });

const useWbsMutation = <TInput,>(projectId: string, mutationFn: (input: TInput) => Promise<unknown>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    // Risks can point at WBS items, and the dashboard rolls up every project's WBS, so refresh those too.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.wbs.list(projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.wbs.listAll() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.risks.list(projectId) }),
      ]),
  });
};

export const useCreateWbsItem = (projectId: string) =>
  useWbsMutation(projectId, (input: WbsItemInsert) => wbsService.create(input));

export const useUpdateWbsItem = (projectId: string) =>
  useWbsMutation(projectId, ({ id, input }: { id: string; input: WbsItemUpdate }) => wbsService.update(id, input));

export const useDeleteWbsItem = (projectId: string) =>
  useWbsMutation(projectId, (id: string) => wbsService.remove(id));
