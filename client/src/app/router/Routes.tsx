import { createBrowserRouter } from "react-router";
import App from "../layout/App";
import LoginForm from "../../features/account/LoginForm";
import RegisterForm from "../../features/account/RegisterForm";
import LeagueList from "../../features/leagues/LeagueList";
import LeagueForm from "../../features/leagues/LeagueForm";

export const router = createBrowserRouter([
    { path: '/', element: <App />, children: [
        { path: 'leagues', element: <LeagueList /> },
        { path: 'createLeague', element: <LeagueForm key='create' /> },
        { path: 'manage/:id', element: <LeagueForm /> },
        { path: 'login', element: <LoginForm /> },
        { path: 'register', element: <RegisterForm /> },
    ]},
])