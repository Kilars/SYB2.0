import { useQuery } from "@tanstack/react-query"
import agent from "../api/agent"

export const useMatch = (id: string) => {
    const {data: match, isLoading: isMatchLoading} = useQuery<Match>({
        queryKey: ["match", id],
        queryFn: async () => {
            const res = await agent.get(`/matches/${id}`);
            return res.data;
        },
    })
    return {
        match,
        isMatchLoading
    }
}