import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import agent from "../api/agent"

export const useMatch = (id: string) => {
    const queryClient = useQueryClient();

    const { data: match, isLoading: isMatchLoading } = useQuery<Match>({
        queryKey: ["match", id],
        queryFn: async () => {
            const res = await agent.get(`/matches/${id}`);
            return res.data;
        },
    })

    const completeMatch = useMutation({
        mutationFn: async (rounds: Round[]) => {
            await agent.post(`matches/${id}/complete`, rounds);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["match", id] });
        }
    });

    const reopenMatch = useMutation({
        mutationFn: async () => {
            await agent.post(`matches/${id}/reopen`);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["match", id] });
        }
    });
    return {
        match,
        isMatchLoading,
        completeMatch,
        reopenMatch
    }
}