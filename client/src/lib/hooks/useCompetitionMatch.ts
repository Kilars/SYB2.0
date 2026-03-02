import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import agent from "../api/agent";

export const useCompetitionMatch = (
  type: "league" | "tournament",
  competitionId: string,
  bracketNumber: number,
  matchNumber: number,
) => {
  const queryClient = useQueryClient();

  const isLeague = type === "league";
  const queryKey = isLeague
    ? ["match", competitionId, bracketNumber, matchNumber]
    : ["tournamentMatch", competitionId, matchNumber];

  const { data: match, isLoading: isMatchLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const url = isLeague
        ? `/matches/${competitionId}/bracket/${bracketNumber}/match/${matchNumber}`
        : `/tournaments/${competitionId}/match/${matchNumber}`;
      const res = await agent.get<Match>(url);
      return res.data;
    },
  });

  const completeMatch = useMutation({
    mutationFn: async (rounds: Round[]) => {
      const url = isLeague
        ? `matches/${competitionId}/bracket/${bracketNumber}/match/${matchNumber}/complete`
        : `/tournaments/${competitionId}/match/${matchNumber}/complete`;
      await agent.post(url, rounds);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      if (!isLeague) {
        await queryClient.invalidateQueries({ queryKey: ["tournament", competitionId] });
      }
    },
  });

  const reopenMatch = useMutation({
    mutationFn: async () => {
      const url = isLeague
        ? `matches/${competitionId}/bracket/${bracketNumber}/match/${matchNumber}/reopen`
        : `/tournaments/${competitionId}/match/${matchNumber}/reopen`;
      await agent.post(url);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      if (!isLeague) {
        await queryClient.invalidateQueries({ queryKey: ["tournament", competitionId] });
      }
    },
  });

  return {
    match,
    isMatchLoading,
    completeMatch,
    reopenMatch,
  };
};
