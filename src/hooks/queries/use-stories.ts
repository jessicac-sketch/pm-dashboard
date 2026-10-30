"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { storiesService } from "@/services/stories.service";
import type { CreateJiraStoriesRequest, GenerateStoriesRequest, RegenerateStoryRequest } from "@/types/stories";

export const useAiHealth = () =>
  useQuery({
    queryKey: queryKeys.ai.health(),
    queryFn: storiesService.aiHealth,
    staleTime: 10 * 60 * 1000,
  });

export const useGenerateStories = () =>
  useMutation({ mutationFn: (input: GenerateStoriesRequest) => storiesService.generate(input) });

export const useRegenerateStory = () =>
  useMutation({ mutationFn: (input: RegenerateStoryRequest) => storiesService.regenerate(input) });

export const useCreateJiraStories = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateJiraStoriesRequest) => storiesService.createInJira(input),
    // New stories can land in the current sprint, so the sprint report should refetch.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.jira.all }),
  });
};
