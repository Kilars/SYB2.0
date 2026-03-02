import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import agent from "../api/agent"

export const useMatch = (competitionId: string, bracketNumber: number, matchNumber: number) => {
    const queryClient = useQueryClient();

    const { data: match, isLoading: isMatchLoading } = useQuery({
        queryKey: ["match", competitionId, bracketNumber, matchNumber],
        queryFn: async () => {
            const res = await agent.get<Match>(`/matches/${competitionId}/bracket/${bracketNumber}/match/${matchNumber}`);
            return res.data;
        }
    })

    const completeMatch = useMutation({
        mutationFn: async (rounds: Round[]) => {
            await agent.post(`matches/${competitionId}/bracket/${bracketNumber}/match/${matchNumber}/complete`, rounds);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["match", competitionId, bracketNumber, matchNumber] });
        }
    });

    const reopenMatch = useMutation({
        mutationFn: async () => {
            await agent.post(`matches/${competitionId}/bracket/${bracketNumber}/match/${matchNumber}/reopen`);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["match", competitionId, bracketNumber, matchNumber] });
        }
    });
    return {
        match,
        isMatchLoading,
        completeMatch,
        reopenMatch
    }
}
