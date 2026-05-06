import { useQuery } from "@tanstack/react-query";

import agent from "../api/agent";

export const useTopCharacters = (userId?: string) => {
  const { data: topCharacterIds = [], isLoading } = useQuery<string[]>({
    queryKey: ["top-characters", userId],
    queryFn: async () => {
      const res = await agent.get<string[]>(`/characters/user/${userId}/top?count=5`);
      return res.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    topCharacterIds,
    isLoading,
  };
};
