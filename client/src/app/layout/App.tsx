import { Box, Container, Link } from "@mui/material";
import { Outlet, ScrollRestoration, useLocation } from "react-router";

import HomePage from "../../features/home/HomePage";
import NavBar from "./NavBar";

function App() {
  const location = useLocation();
  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <ScrollRestoration />
      <Link
        href="#main-content"
        sx={{
          position: "absolute",
          left: -9999,
          top: "auto",
          width: 1,
          height: 1,
          overflow: "hidden",
          zIndex: 9999,
          "&:focus": {
            position: "fixed",
            top: 8,
            left: 8,
            width: "auto",
            height: "auto",
            overflow: "visible",
            bgcolor: "primary.main",
            color: "white",
            px: 2,
            py: 1,
            borderRadius: 1,
            fontWeight: "bold",
            textDecoration: "none",
            boxShadow: 4,
          },
        }}
      >
        Skip to content
      </Link>
      {location.pathname === "/" ? (
        <HomePage />
      ) : (
        <>
          <NavBar />
          <Container
            component="main"
            id="main-content"
            maxWidth="xl"
            sx={{ pt: { xs: 8, sm: 10 } }}
          >
            <Outlet />
          </Container>
        </>
      )}
    </Box>
  );
}

export default App;
