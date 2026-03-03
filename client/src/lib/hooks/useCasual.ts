import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import agent from "../api/agent";

export const useCasual = () => {
  const queryClient = useQueryClient();

  const { data: casualMatches, isLoading: isCasualLoading } = useQuery({
    queryKey: ["casual-matches"],
    queryFn: async () => {
      const res = await agent.get<Match[]>("/casual");
      return res.data;
    },
  });

  const createCasualMatch = useMutation({
    mutationFn: async (data: CreateCasualMatchInput) => {
      await agent.post("/casual", data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["casual-matches"] });
    },
  });

  return {
    casualMatches,
    isCasualLoading,
    createCasualMatch,
  };
};
