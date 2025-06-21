import { createBrowserRouter } from "react-router";
import App from "../layout/App";
import LoginForm from "../../features/account/LoginForm";
import RegisterForm from "../../features/account/RegisterForm";
import LeagueList from "../../features/leagues/LeagueList";

export const router = createBrowserRouter([
    { path: '/', element: <App />, children: [
        { path: 'leagues', element: <LeagueList /> },
        { path: 'login', element: <LoginForm /> },
        { path: 'register', element: <RegisterForm /> },
    ]},
])