import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import agent from "../api/agent";
import { useLocation } from "react-router";

export const useUsers = () => {
    const location = useLocation();
    const queryClient = useQueryClient();
    const { data: users } = useQuery<User[]>({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await agent.get<User[]>('/account/users');
            return res.data;
        },
        enabled: location.pathname === '/createLeague' || location.pathname.includes('/manage')
    });

    const createGuest = useMutation({
        mutationFn: async (displayName: string) => {
            const res = await agent.post<User>('/account/guest', { displayName });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        }
    });

    const mergeGuest = useMutation({
        mutationFn: async (data: { guestUserId: string; targetUserId: string }) => {
            await agent.post('/account/merge-guest', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["league"] });
            queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
            queryClient.invalidateQueries({ queryKey: ["userMatches"] });
        }
    });

    return {
        users,
        createGuest,
        mergeGuest
    }
}
