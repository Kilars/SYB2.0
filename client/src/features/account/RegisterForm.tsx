import { zodResolver } from "@hookform/resolvers/zod";
import { PersonAdd, SportsEsports } from "@mui/icons-material";
import { Box, Button, CircularProgress, Paper, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { Link } from "react-router";

import { useAppTheme } from "../../app/context/ThemeContext";
import TextInput from "../../app/shared/components/TextInput";
import { useAccount } from "../../lib/hooks/useAccount";
import { type RegisterSchema, registerSchema } from "../../lib/schemas/registerSchema";

export default function RegisterForm() {
  const { registerUser } = useAccount();
  const { meta } = useAppTheme();
  const {
    control,
    handleSubmit,
    setError,
    formState: { isValid, isSubmitting },
  } = useForm<RegisterSchema>({
    mode: "onTouched",
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterSchema) => {
    await registerUser.mutateAsync(data, {
      onError: (error) => {
        if (Array.isArray(error)) {
          error.forEach((err) => {
            if (err.includes("Email")) setError("email", { message: err });
            if (err.includes("Password")) setError("password", { message: err });
          });
        }
      },
    });
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
            <PersonAdd fontSize="large" />
            <Typography variant="h4" fontWeight="bold">
              Register
            </Typography>
          </Box>
        </Box>

        <Box display="flex" flexDirection="column" gap={3}>
          <TextInput label="Email" control={control} name="email" />
          <TextInput label="Display name" control={control} name="displayName" />
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
            }}
          >
            {isSubmitting ? "Registering..." : "Register"}
          </Button>
        </Box>
        <Typography sx={{ textAlign: "center" }}>
          Already have an account?
          <Typography
            sx={{ ml: 2, fontWeight: "bold" }}
            component={Link}
            to="/login"
            color="secondary"
          >
            Sign in
          </Typography>
        </Typography>
      </Paper>
    </Box>
  );
}
