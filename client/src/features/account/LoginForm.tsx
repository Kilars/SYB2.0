import { zodResolver } from "@hookform/resolvers/zod";
import { LockOpen, SportsEsports } from "@mui/icons-material";
import { Box, Button, CircularProgress, Paper, Typography } from "@mui/material";
import  useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";

import { useAppTheme } from "../../app/context/ThemeContext";
import TextInput from "../../app/shared/components/TextInput";
import { useAccount } from "../../lib/hooks/useAccount";
import { type LoginSchema, loginSchema } from "../../lib/schemas/loginSchema";

export default function LoginForm() {
  const { loginUser } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();
  const { meta } = useAppTheme();
  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<LoginSchema>({
    mode: "onTouched",
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    await loginUser.mutateAsync(data);
    navigate(location.state?.from?.pathname || "/leagues");
  };
  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: meta.heroGradient,
        borderRadius: 3,
        p: 3,
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          display: "flex",
          flexDirection: "column",
          p: 4,
          gap: 3,
          maxWidth: "sm",
          width: "100%",
          mx: "auto",
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
          <SportsEsports sx={{ fontSize: 48, color: "primary.main" }} />
          <Box display="flex" alignItems="center" gap={1.5} color="secondary.main">
            <LockOpen fontSize="large" />
            <Typography variant="h4" fontWeight="bold">
              Sign in
            </Typography>
          </Box>
        </Box>

        <Box display="flex" flexDirection="column" gap={3}>
          <TextInput label="Email" control={control} name="email" />
          <TextInput label="Password" control={control} name="password" type="password" />
          <Button
            type="submit"
            variant="contained"
            disabled={!isValid || isSubmitting}
            size="large"
            startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
            sx={{
              background: meta.accentGradient,
              color: "white",
              fontWeight: "bold",
              py: 1.5,
              "&:hover": { opacity: 0.85 },
              "&:focus-visible": {
                outline: "2px solid",
                outlineColor: "secondary.main",
                outlineOffset: 2,
              },
            }}
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </Button>
        </Box>
        <Typography sx={{ textAlign: "center" }}>
          Don't have an account?
          <Typography
            sx={{ ml: 2, fontWeight: "bold" }}
            component={Link}
            to="/register"
            color="secondary"
          >
            Sign up
          </Typography>
        </Typography>
      </Paper>
    </Box>
  );
}
