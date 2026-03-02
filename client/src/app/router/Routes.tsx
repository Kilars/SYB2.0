import { createBrowserRouter } from "react-router";

import LoginForm from "../../features/account/LoginForm";
import RegisterForm from "../../features/account/RegisterForm";
import CompetitionForm from "../../features/competitions/CompetitionForm";
import ServerError from "../../features/error/ServerError";
import LeagueList from "../../features/leagues/LeagueList";
import LeagueTabs from "../../features/leagues/LeagueTabs";
import MatchDetails from "../../features/matches/MatchDetails";
import UserStats from "../../features/stats/UserStats";
import BracketView from "../../features/tournaments/BracketView";
import TournamentList from "../../features/tournaments/TournamentList";
import App from "../layout/App";
import RequireAuth from "./RequireAuth";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        element: <RequireAuth />,
        children: [
          { path: "createLeague", element: <CompetitionForm type="league" key="create" /> },
          { path: "manage/:competitionId", element: <CompetitionForm type="league" /> },
          { path: "user/:userId", element: <UserStats /> },
          {
            path: "leagues/:competitionId/description",
            element: <LeagueTabs key="description" tab="description" />,
          },
          {
            path: "leagues/:competitionId/leaderboard",
            element: <LeagueTabs key="leaderboard" tab="leaderboard" />,
          },
          {
            path: "leagues/:competitionId/matches",
            element: <LeagueTabs key="matches" tab="matches" />,
          },
          { path: "leagues/:competitionId/stats", element: <LeagueTabs key="stats" tab="stats" /> },
          {
            path: "leagues/:competitionId/bracket/:bracketNumber/match/:matchNumber",
            element: <MatchDetails type="league" />,
          },
          { path: "createTournament", element: <CompetitionForm type="tournament" /> },
          { path: "tournaments/:competitionId", element: <BracketView /> },
          {
            path: "tournaments/:competitionId/bracket/:bracketNumber/match/:matchNumber",
            element: <MatchDetails type="tournament" />,
          },
        ],
      },
      { path: "leagues", element: <LeagueList /> },
      { path: "tournaments", element: <TournamentList /> },
      { path: "login", element: <LoginForm /> },
      { path: "register", element: <RegisterForm /> },
      { path: "server-error", element: <ServerError /> },
    ],
  },
]);
