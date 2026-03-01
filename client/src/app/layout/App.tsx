import { Box, Container } from "@mui/material";
import NavBar from "./NavBar";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import HomePage from "../../features/home/HomePage";

function App() {
  const location = useLocation();
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <ScrollRestoration />
      {location.pathname === '/' ? <HomePage /> : (
        <>
          <NavBar />
          <Container maxWidth='xl' sx={{ pt: { xs: 8, sm: 10 } }}>
            <Outlet />
          </Container>
        </>
        )
      }
    </Box>
  )
}

export default App
