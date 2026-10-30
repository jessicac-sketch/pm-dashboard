"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { peopleService, type PeoplePageParams } from "@/services/people.service";
import type { PersonInsert, PersonUpdate } from "@/types/database";

export const usePeople = () =>
  useQuery({
    queryKey: queryKeys.people.list(),
    queryFn: peopleService.list,
  });

/** One page of people from the server; the previous page stays on screen while the next loads. */
export const usePeoplePage = (params: PeoplePageParams) =>
  useQuery({
    queryKey: queryKeys.people.page(params),
    queryFn: () => peopleService.listPage(params),
    placeholderData: keepPreviousData,
  });

export const useCreatePerson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PersonInsert) => peopleService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.people.all }),
  });
};

export const useUpdatePerson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PersonUpdate }) =>
      peopleService.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.people.all }),
  });
};
