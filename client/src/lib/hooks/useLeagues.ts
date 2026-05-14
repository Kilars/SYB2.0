import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import agent from "../api/agent";
import { type LeagueSchema } from "../schemas/competitionSchema";

export const useLeagues = (id?: string) => {
  const queryClient = useQueryClient();

  const { data: leagues, isLoading: isLeaguesLoading } = useQuery({
    queryKey: ["leagues"],
    queryFn: async () => {
      const res = await agent.get<League[]>("/leagues");
      return res.data;
    },
    enabled: !id,
  });

  const { data: league, isLoading: isLeagueLoading } = useQuery({
    queryKey: ["league", id],
    queryFn: async () => {
      const res = await agent.get<League>(`/leagues/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: leaderboard, isLoading: isLeaderboardLoading } = useQuery({
    queryKey: ["leaderboard", id],
    queryFn: async () => {
      const res = await agent.get<LeaderboardUser[]>(`/leagues/${id}/leaderboard`);
      return res.data;
    },
    enabled: !!id,
  });

  const createLeague = useMutation({
    mutationFn: async (data: LeagueSchema) => {
      const res = await agent.post("/leagues", data);
      return res.data;
    },
  });

  const updateLeague = useMutation({
    mutationFn: async (data: LeagueSchema) => {
      await agent.put(`/leagues/${data.id}`, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["league", id] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (data: number | { status: number; playerCount?: number }) => {
      const status = typeof data === "number" ? data : data.status;
      const playerCount = typeof data === "number" ? undefined : data.playerCount;
      const params = new URLSearchParams({ status: String(status) });
      if (playerCount != null) params.append("playerCount", String(playerCount));
      await agent.post(`leagues/${id}/status?${params.toString()}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["league", id] });
    },
  });

  const deleteLeague = useMutation({
    mutationFn: async () => {
      await agent.delete(`/leagues/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leagues"] });
    },
  });

  return {
    leagues,
    league,
    leaderboard,
    isLeaderboardLoading,
    isLeagueLoading,
    isLeaguesLoading,
    createLeague,
    updateLeague,
    updateStatus,
    deleteLeague,
  };
};
