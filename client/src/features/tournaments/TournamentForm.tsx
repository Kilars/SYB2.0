import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { startOfToday } from "date-fns";
import { tournamentSchema, type TournamentSchema } from "../../lib/schemas/tournamentSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTournaments } from "../../lib/hooks/useTournaments";
import { Box, Button, FormControl, InputLabel, MenuItem, Paper, Select, Typography, CircularProgress } from "@mui/material";
import { EmojiEvents, Add } from "@mui/icons-material";
import TextInput from "../../app/shared/components/TextInput";
import UserSelectInput from "../../app/shared/components/UserSelectInput";
import { useUsers } from "../../lib/hooks/useUsers";
import { useAccount } from "../../lib/hooks/useAccount";
import DateTimeInput from "../../app/shared/components/DateTimeInput";
import { Controller } from "react-hook-form";

export default function TournamentForm() {
    const { users, createGuest } = useUsers();
    const { currentUser } = useAccount();
    const { createTournament } = useTournaments();
    const navigate = useNavigate();
    const { control, handleSubmit, formState: { isValid, isSubmitting, isDirty } } = useForm({
        mode: 'onTouched',
        resolver: zodResolver(tournamentSchema),
        defaultValues: {
            bestOf: 3,
            startDate: startOfToday(),
        }
    });

    const onSubmit = async (data: TournamentSchema) => {
        await createTournament.mutateAsync(data, {
            onSuccess: (id) => navigate(`/tournaments/${id}`)
        });
    };

    return (
        <Paper
            component='form'
            onSubmit={handleSubmit(onSubmit)}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                p: { xs: 2, sm: 3 },
                gap: 3,
                maxWidth: 'md',
                mx: 'auto',
                borderRadius: 3
            }}
        >
            <Box display='flex' alignItems='center' justifyContent='center' gap={3} color='secondary.main'>
                <EmojiEvents fontSize="large" />
                <Typography variant="h4">Create Tournament</Typography>
            </Box>
            <Box display='flex' flexDirection='column' gap={3}>
                <TextInput label='Title' control={control} name='title' />
                <TextInput label='Description' control={control} name='description' />
                <DateTimeInput label='Date' control={control} name='startDate' defaultValue={startOfToday()} />

                <Controller
                    name="bestOf"
                    control={control}
                    render={({ field }) => (
                        <FormControl fullWidth>
                            <InputLabel>Best Of</InputLabel>
                            <Select {...field} label="Best Of">
                                <MenuItem value={1}>Best of 1</MenuItem>
                                <MenuItem value={3}>Best of 3</MenuItem>
                                <MenuItem value={5}>Best of 5</MenuItem>
                            </Select>
                        </FormControl>
                    )}
                />

                {users && currentUser &&
                    <UserSelectInput
                        label='Add players (4, 8, 16, or 32)'
                        control={control}
                        name='members'
                        users={users}
                        currentUser={currentUser}
                        defaultValue={[{ userId: currentUser.id, displayName: currentUser.displayName }]}
                        onCreateGuest={async (displayName) => await createGuest.mutateAsync(displayName)}
                    />
                }
                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
                    <Button color="inherit" onClick={() => navigate(-1)}>Cancel</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={!isDirty || !isValid || isSubmitting}
                        size="large"
                        startIcon={isSubmitting ? <CircularProgress size={20} /> : <Add />}
                        sx={{
                            fontWeight: 'bold',
                            px: 3,
                            '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                        }}
                    >
                        {isSubmitting ? 'Creating...' : 'Create Tournament'}
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
}
