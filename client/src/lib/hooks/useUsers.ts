import { useQuery } from "@tanstack/react-query";
import agent from "../api/agent";
import { useLocation } from "react-router";

export const useUsers= () => {
    const location = useLocation();
    const { data: users } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await agent.get<User[]>('/account/users');
            return res.data;
        },
        enabled: location.pathname === '/createLeague' || location.pathname.includes('/manage')
    });

    return {
        users
    }
}