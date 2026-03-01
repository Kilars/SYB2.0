import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import agent from "../api/agent";

export const useTournamentMatch = (tournamentId: string, matchNumber: number) => {
    const queryClient = useQueryClient();

    const { data: match, isLoading: isMatchLoading } = useQuery({
        queryKey: ["tournamentMatch", tournamentId, matchNumber],
        queryFn: async () => {
            const res = await agent.get<TournamentMatch>(`/tournaments/${tournamentId}/match/${matchNumber}`);
            return res.data;
        }
    });

    const completeMatch = useMutation({
        mutationFn: async (rounds: TournamentRound[]) => {
            await agent.post(`/tournaments/${tournamentId}/match/${matchNumber}/complete`, rounds);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["tournamentMatch", tournamentId, matchNumber] });
            await queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
        }
    });

    const reopenMatch = useMutation({
        mutationFn: async () => {
            await agent.post(`/tournaments/${tournamentId}/match/${matchNumber}/reopen`);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["tournamentMatch", tournamentId, matchNumber] });
            await queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
        }
    });

    return {
        match,
        isMatchLoading,
        completeMatch,
        reopenMatch,
    };
};
