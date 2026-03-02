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
import TournamentList from "../../features/tournaments/TournamentList";
import TournamentForm from "../../features/tournaments/TournamentForm";
import BracketView from "../../features/tournaments/BracketView";
import TournamentMatchDetails from "../../features/tournaments/TournamentMatchDetails";

export const router = createBrowserRouter([
    {
        path: '/', element: <App />, children: [
            {
                element: <RequireAuth />, children: [
                    { path: 'createLeague', element: <LeagueForm key='create' /> },
                    { path: 'manage/:competitionId', element: <LeagueForm /> },
                    { path: 'user/:userId', element: <UserStats /> },
                    { path: 'leagues/:competitionId/description', element: <LeagueTabs key='description' tab='description' /> },
                    { path: 'leagues/:competitionId/leaderboard', element: <LeagueTabs key='leaderboard' tab='leaderboard' /> },
                    { path: 'leagues/:competitionId/matches', element: <LeagueTabs key='matches' tab='matches' /> },
                    { path: 'leagues/:competitionId/stats', element: <LeagueTabs key='stats' tab='stats' /> },
                    { path: 'leagues/:competitionId/bracket/:bracketNumber/match/:matchNumber', element: <MatchDetails /> },
                    { path: 'createTournament', element: <TournamentForm /> },
                    { path: 'tournaments/:competitionId', element: <BracketView /> },
                    { path: 'tournaments/:competitionId/match/:matchNumber', element: <TournamentMatchDetails /> },
                ]
            },
            { path: 'leagues', element: <LeagueList /> },
            { path: 'tournaments', element: <TournamentList /> },
            { path: 'login', element: <LoginForm /> },
            { path: 'register', element: <RegisterForm /> },
            { path: 'server-error', element: <ServerError /> },
        ]
    },
])
