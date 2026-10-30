"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { allocationsService, type AllocationChanges } from "@/services/allocations.service";

export const useAllocations = () =>
  useQuery({
    queryKey: queryKeys.allocations.list(),
    queryFn: allocationsService.list,
  });

export const useSaveAllocations = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: AllocationChanges) => allocationsService.saveChanges(changes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.allocations.all }),
  });
};
