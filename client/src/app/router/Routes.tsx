import { createBrowserRouter } from "react-router";
import App from "../layout/App";
import LoginForm from "../../features/account/LoginForm";
import RegisterForm from "../../features/account/RegisterForm";
import LeagueList from "../../features/leagues/LeagueList";
import LeagueForm from "../../features/leagues/LeagueForm";
import RequireAuth from "./RequireAuth";
import MatchDetails from "../../features/matches/MatchDetails";
import ServerError from "../../features/error/ServerError";
import LeagueTabs from "../../features/leagues/LeagueTabs";

export const router = createBrowserRouter([
    {
        path: '/', element: <App />, children: [
            {
                element: <RequireAuth />, children: [
                    { path: 'createLeague', element: <LeagueForm key='create' /> },
                    { path: 'manage/:id', element: <LeagueForm /> },
                    { path: 'leagues/:id/description', element: <LeagueTabs key='description' tab='description' /> },
                    { path: 'leagues/:id/leaderboard', element: <LeagueTabs key='leaderboard' tab='leaderboard' /> },
                    { path: 'leagues/:id/matches', element: <LeagueTabs key='matches' tab='matches' /> },
                    { path: 'leagues/:id/stats', element: <LeagueTabs key='stats' tab='stats' /> },
                    { path: 'leagues/:leagueId/matches/:matchId', element: <MatchDetails /> },
                ]
            },
            { path: 'leagues', element: <LeagueList /> },
            { path: 'login', element: <LoginForm /> },
            { path: 'register', element: <RegisterForm /> },
            { path: 'server-error', element: <ServerError /> },
        ]
    },
])