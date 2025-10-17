
import { useQuery } from "@tanstack/react-query"
import agent from "../api/agent"

export const useUserMatches = (id: string) => {
    const { data: userMatches, isLoading: isUserMatchesLoading } = useQuery<Match[]>({
        queryKey: ["user-stats", id],
        queryFn: async () => {
            const res = await agent.get(`/matches/user/${id}`);
            return res.data;
        },
    })

    return {
        userMatches,
        isUserMatchesLoading
    }
}