import { ErrorOutline, Home, Refresh } from "@mui/icons-material";
import { Box, Button, Divider, Paper, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router";

export default function ServerError() {
  const { state } = useLocation();
  const navigate = useNavigate();

  return (
    <Paper sx={{ borderTop: "4px solid", borderColor: "error.main", p: { xs: 3, sm: 4 } }}>
      <Box display="flex" alignItems="center" gap={1.5} mb={2}>
        <ErrorOutline sx={{ fontSize: 36, color: "error.main" }} />
        <Typography
          variant="h4"
          sx={{ fontSize: { xs: "1.25rem", sm: "2rem" } }}
          color="error.main"
          fontWeight="bold"
        >
          {state?.error?.message || "Something went wrong"}
        </Typography>
      </Box>

      {state?.error?.details && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body1" sx={{ wordBreak: "break-word", color: "text.secondary" }}>
            {state.error.details}
          </Typography>
        </>
      )}

      <Box display="flex" gap={2} mt={4} flexWrap="wrap">
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={() => navigate(0)}
        >
          Retry
        </Button>
        <Button
          variant="outlined"
          startIcon={<Home />}
          onClick={() => navigate("/")}
        >
          Go Home
        </Button>
      </Box>
    </Paper>
  );
}
