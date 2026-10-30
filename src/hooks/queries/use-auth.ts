"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { authService, type SignInInput } from "@/services/auth.service";

export const useCurrentUser = () =>
  useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: authService.getCurrentUser,
  });

export const useSignIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SignInInput) => authService.signIn(input),
    onSuccess: (user) => queryClient.setQueryData(queryKeys.auth.user(), user),
  });
};

export const useSignOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authService.signOut,
    // Drop every cached query so the next user never sees the previous user's data.
    onSuccess: () => queryClient.clear(),
  });
};
