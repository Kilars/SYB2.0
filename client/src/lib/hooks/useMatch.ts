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
        onMutate: async (rounds) => {
            await queryClient.cancelQueries({ queryKey: ["match", id] });

            const match = queryClient.getQueryData<Match>(["match", id]);
            queryClient.setQueryData(["match", id], () => {
                return {
                    ...match,
                    rounds: rounds,
                    completed: true
                }
            });
        }
    });

    const reopenMatch = useMutation({
        mutationFn: async () => {
            await agent.post(`matches/${id}/reopen`);
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["match", id] });

            const match = queryClient.getQueryData<Match>(["match", id]);
            queryClient.setQueryData(["match", id], () => {
                return {
                    ...match,
                    completed: false
                }
            });
        }
    });
    return {
        match,
        isMatchLoading,
        completeMatch,
        reopenMatch
    }
}