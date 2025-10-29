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
import UserStats from "../../features/stats/UserStats";

export const router = createBrowserRouter([
    {
        path: '/', element: <App />, children: [
            {
                element: <RequireAuth />, children: [
                    { path: 'createLeague', element: <LeagueForm key='create' /> },
                    { path: 'manage/:leagueId', element: <LeagueForm /> },
                    { path: 'user/:userId', element: <UserStats /> },
                    { path: 'leagues/:leagueId/description', element: <LeagueTabs key='description' tab='description' /> },
                    { path: 'leagues/:leagueId/leaderboard', element: <LeagueTabs key='leaderboard' tab='leaderboard' /> },
                    { path: 'leagues/:leagueId/matches', element: <LeagueTabs key='matches' tab='matches' /> },
                    { path: 'leagues/:leagueId/stats', element: <LeagueTabs key='stats' tab='stats' /> },
                    { path: 'leagues/:leagueId/split/:split/match/:match', element: <MatchDetails /> },
                ]
            },
            { path: 'leagues', element: <LeagueList /> },
            { path: 'login', element: <LoginForm /> },
            { path: 'register', element: <RegisterForm /> },
            { path: 'server-error', element: <ServerError /> },
        ]
    },
])