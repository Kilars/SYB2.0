import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import agent from "../api/agent"

export const useMatch = (leagueId: string, split: number, matchNumber: number) => {
    const queryClient = useQueryClient();

    const { data: match, isLoading: isMatchLoading } = useQuery({
        queryKey: ["match", leagueId, split, matchNumber],
        queryFn: async () => {
            const res = await agent.get<Match>(`/matches/${leagueId}/split/${split}/match/${matchNumber}`);
            return res.data;
        }
    })

    const completeMatch = useMutation({
        mutationFn: async (rounds: Round[]) => {
            await agent.post(`matches/${leagueId}/split/${split}/match/${matchNumber}/complete`, rounds);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["match", leagueId, split, matchNumber] });
        }
    });

    const reopenMatch = useMutation({
        mutationFn: async () => {
            await agent.post(`matches/${leagueId}/split/${split}/match/${matchNumber}/reopen`);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["match", leagueId, split, matchNumber] });
        }
    });
    return {
        match,
        isMatchLoading,
        completeMatch,
        reopenMatch
    }
}