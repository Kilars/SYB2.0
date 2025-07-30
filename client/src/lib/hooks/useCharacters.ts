import { useQuery } from "@tanstack/react-query";
import agent from "../api/agent";

export const useCharacters = () => {
    const { data: characters, isLoading: charactersIsLoading } = useQuery<Character[]>({
        queryKey: ["characters"],
        queryFn: async () => {
            const res = await agent.get<Character[]>('/characters');
            return res.data;
        },
        staleTime: Infinity
    });

    return {
        characters,
        charactersIsLoading
    }
}
