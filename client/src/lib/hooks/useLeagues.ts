import { useQuery } from "@tanstack/react-query";
import agent from "../api/agent";

export const useLeagues = () => {
    const { data: leagues, isLoading: isLeaguesLoading } = useQuery({
        queryKey: ["leagues"],
        queryFn: async () => {
            const res = await agent.get<League[]>('/leagues');
            return res.data
        }
    })

    return {
        leagues,
        isLeaguesLoading
    }
}