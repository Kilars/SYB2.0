import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import agent from "../api/agent";
import { type TournamentSchema } from "../schemas/competitionSchema";

export const useTournaments = (id?: string) => {
  const queryClient = useQueryClient();

  const { data: tournaments, isLoading: isTournamentsLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const res = await agent.get<Tournament[]>("/tournaments");
      return res.data;
    },
    enabled: !id,
  });

  const { data: tournament, isLoading: isTournamentLoading } = useQuery({
    queryKey: ["tournament", id],
    queryFn: async () => {
      const res = await agent.get<Tournament>(`/tournaments/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const createTournament = useMutation({
    mutationFn: async (data: TournamentSchema) => {
      const res = await agent.post("/tournaments", data);
      return res.data;
    },
  });

  const startTournament = useMutation({
    mutationFn: async () => {
      await agent.post(`/tournaments/${id}/start`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tournament", id] });
    },
  });

  const shuffleBracket = useMutation({
    mutationFn: async () => {
      await agent.post(`/tournaments/${id}/shuffle`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tournament", id] });
    },
  });

  const deleteTournament = useMutation({
    mutationFn: async () => {
      await agent.delete(`/tournaments/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });

  return {
    tournaments,
    tournament,
    isTournamentsLoading,
    isTournamentLoading,
    createTournament,
    startTournament,
    shuffleBracket,
    deleteTournament,
  };
};
