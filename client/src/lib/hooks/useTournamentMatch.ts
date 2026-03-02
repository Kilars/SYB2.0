import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import agent from "../api/agent";

export const useTournamentMatch = (competitionId: string, matchNumber: number) => {
    const queryClient = useQueryClient();

    const { data: match, isLoading: isMatchLoading } = useQuery({
        queryKey: ["tournamentMatch", competitionId, matchNumber],
        queryFn: async () => {
            const res = await agent.get<Match>(`/tournaments/${competitionId}/match/${matchNumber}`);
            return res.data;
        }
    });

    const completeMatch = useMutation({
        mutationFn: async (rounds: Round[]) => {
            await agent.post(`/tournaments/${competitionId}/match/${matchNumber}/complete`, rounds);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["tournamentMatch", competitionId, matchNumber] });
            await queryClient.invalidateQueries({ queryKey: ["tournament", competitionId] });
        }
    });

    const reopenMatch = useMutation({
        mutationFn: async () => {
            await agent.post(`/tournaments/${competitionId}/match/${matchNumber}/reopen`);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["tournamentMatch", competitionId, matchNumber] });
            await queryClient.invalidateQueries({ queryKey: ["tournament", competitionId] });
        }
    });

    return {
        match,
        isMatchLoading,
        completeMatch,
        reopenMatch,
    };
};
