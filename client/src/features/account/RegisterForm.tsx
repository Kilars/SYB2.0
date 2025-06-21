import { useForm } from "react-hook-form";
import { useAccount } from "../../lib/hooks/useAccount";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Paper, Typography } from "@mui/material";
import { LockOpen } from "@mui/icons-material";
import TextInput from "../../app/shared/components/TextInput";
import { Link } from "react-router";
import { registerSchema, type RegisterSchema } from "../../lib/schemas/registerSchema";

export default function LoginForm() {
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
                console.log(error);
            }
        });
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
                <Typography variant="h4">Register</Typography>
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
                    >
                    Register
                </Button>
            </Box>
            <Typography sx={{textAlign: 'center'}}>
                Already have an account?
                <Typography sx={{ml: 2}} component={Link} to='/login' color="primary">
                    Sign in
                </Typography>
            </Typography>
        </Paper>
    )
}