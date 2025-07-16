import { createBrowserRouter } from "react-router";
import App from "../layout/App";
import LoginForm from "../../features/account/LoginForm";
import RegisterForm from "../../features/account/RegisterForm";
import LeagueList from "../../features/leagues/LeagueList";
import LeagueForm from "../../features/leagues/LeagueForm";
import RequireAuth from "./RequireAuth";
import LeagueDetails from "../../features/leagues/LeagueDetails";

export const router = createBrowserRouter([
    {
        path: '/', element: <App />, children: [
            {
                element: <RequireAuth />, children: [
                    { path: 'createLeague', element: <LeagueForm key='create' /> },
                    { path: 'manage/:id', element: <LeagueForm /> },
                    { path: 'leagues/:id', element: <LeagueDetails />}
                ]
            },
            { path: 'leagues', element: <LeagueList /> },
            { path: 'login', element: <LoginForm /> },
            { path: 'register', element: <RegisterForm /> },
        ]
    },
])