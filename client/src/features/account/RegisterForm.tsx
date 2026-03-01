import { useForm } from "react-hook-form";
import { useAccount } from "../../lib/hooks/useAccount";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Paper, Typography, CircularProgress } from "@mui/material";
import { PersonAdd, SportsEsports } from "@mui/icons-material";
import TextInput from "../../app/shared/components/TextInput";
import { Link } from "react-router";
import { registerSchema, type RegisterSchema } from "../../lib/schemas/registerSchema";
import { APP_GRADIENT, SMASH_COLORS } from "../../app/theme";

export default function RegisterForm() {
    const {registerUser} = useAccount();
    const {control, handleSubmit, setError, formState: { isValid, isSubmitting }} = useForm<RegisterSchema>({
        mode: 'onTouched',
        resolver: zodResolver(registerSchema)
    })

    const onSubmit = async (data: RegisterSchema) => {
        await registerUser.mutateAsync(data, {
            onError: (error) => {
                if (Array.isArray(error)) {
                    error.forEach(err => {
                        if (err.includes('Email')) setError('email', {message: err});
                        if (err.includes('Password')) setError('password', {message: err});
                    })

                }
            }
        });
    }
    return (
        <Box sx={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: APP_GRADIENT,
            borderRadius: 3,
            p: 3,
        }}>
            <Paper
                component='form'
                onSubmit={handleSubmit(onSubmit)}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    p: 4,
                    gap: 3,
                    maxWidth: 'sm',
                    width: '100%',
                    mx: 'auto',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                }}
            >
                <Box display='flex' flexDirection='column' alignItems='center' gap={1}>
                    <SportsEsports sx={{ fontSize: 48, color: SMASH_COLORS.p2Blue }} />
                    <Box display='flex' alignItems='center' gap={1.5} color='secondary.main'>
                        <PersonAdd fontSize="large" />
                        <Typography variant="h4" fontWeight="bold">Register</Typography>
                    </Box>
                </Box>

                <Box display='flex' flexDirection='column' gap={3}>
                    <TextInput label='Email' control={control} name='email' />
                    <TextInput label='Display name' control={control} name='displayName' />
                    <TextInput label='Password' control={control} name='password' type="password" />
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={!isValid || isSubmitting}
                        size="large"
                        startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
                        sx={{
                            background: `linear-gradient(135deg, ${SMASH_COLORS.p2Blue}, ${SMASH_COLORS.p4Green})`,
                            fontWeight: 'bold',
                            py: 1.5,
                            '&:hover': { background: `linear-gradient(135deg, ${SMASH_COLORS.p2Blue}cc, ${SMASH_COLORS.p4Green}cc)` },
                        }}
                    >
                        {isSubmitting ? 'Registering...' : 'Register'}
                    </Button>
                </Box>
                <Typography sx={{textAlign: 'center'}}>
                    Already have an account?
                    <Typography sx={{ml: 2, fontWeight: 'bold'}} component={Link} to='/login' color="secondary">
                        Sign in
                    </Typography>
                </Typography>
            </Paper>
        </Box>
    )
}
