import { useForm } from "react-hook-form";
import { useAccount } from "../../lib/hooks/useAccount";
import { loginSchema, type LoginSchema } from "../../lib/schemas/loginSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Paper, Typography, CircularProgress } from "@mui/material";
import { LockOpen } from "@mui/icons-material";
import TextInput from "../../app/shared/components/TextInput";
import { Link, useLocation, useNavigate } from "react-router";

export default function LoginForm() {
    const {loginUser} = useAccount();
    const navigate = useNavigate();
    const location = useLocation();
    const {control, handleSubmit, formState: { isValid, isSubmitting }} = useForm<LoginSchema>({
        mode: 'onTouched',
        resolver: zodResolver(loginSchema)
    })

    const onSubmit = async (data: LoginSchema) => {
        await loginUser.mutateAsync(data);
        navigate(location.state?.from?.pathname || '/leagues')
    }
    return (
        <Paper
            component='form'
            onSubmit={handleSubmit(onSubmit)}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                p: 3,
                g: 3,
                maxWidth: 'md',
                mx: 'auto',
                borderRadius: 3
            }}
        >

            <Box display='flex' alignItems='center' justifyContent='center' gap={3} color='secondary.main'>
                <LockOpen fontSize="large" />
                <Typography variant="h4">Sign in</Typography>
            </Box>

            <Box display='flex' flexDirection='column' gap={3}>
                <TextInput label='Email' control={control} name='email' />
                <TextInput label='Password' control={control} name='password' type="password" />
                <Button
                    type="submit"
                    variant="contained"
                    disabled={!isValid || isSubmitting}
                    size="large"
                    startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
                    >
                    {isSubmitting ? 'Signing in...' : 'Login'}
                </Button>
            </Box>
            <Typography sx={{textAlign: 'center'}}>
                Don't have an account?
                <Typography sx={{ml: 2}} component={Link} to='/register' color="primary">
                    Sign up
                </Typography>
            </Typography>
        </Paper>
    )
}