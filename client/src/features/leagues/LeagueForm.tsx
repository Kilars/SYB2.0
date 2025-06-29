import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { startOfToday } from "date-fns";
import { leagueSchema, type LeagueSchema } from "../../lib/schemas/leagueSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { Box, Button, Paper, Typography } from "@mui/material";
import { Leaderboard } from "@mui/icons-material";
import TextInput from "../../app/shared/components/TextInput";
import UserSelectInput from "../../app/shared/components/UserSelectInput";
import { useUsers } from "../../lib/hooks/useUsers";
import { useAccount } from "../../lib/hooks/useAccount";
import DateTimeInput from "../../app/shared/components/DateTimeInput";
import { useEffect } from "react";

export default function LeagueForm() {
    const { id } = useParams();
    const { users } = useUsers();
    const { currentUser } = useAccount();
    const { createLeague, updateLeague, league, isLeagueLoading } = useLeagues(id);
    const navigate = useNavigate();
    const { control, handleSubmit, formState: { isValid, isSubmitting, isDirty }, reset } = useForm<LeagueSchema>({
        mode: 'onTouched',
        resolver: zodResolver(leagueSchema)
    })

    const onSubmit = async (data: LeagueSchema) => {
        if (!league) {
            await createLeague.mutateAsync(data);
            navigate('/leagues');
        } else {
            await updateLeague.mutateAsync({...league, ...data});
            navigate('/leagues');
        }
    }

    useEffect(() => {
        if (league) reset(league)
    }, [reset, league])

    if (isLeagueLoading) return <Typography>Loading...</Typography>
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
                <Leaderboard fontSize="large" />
                <Typography variant="h4">{id ? 'Edit' : 'Create' } League</Typography>
            </Box>
            <Box display='flex' flexDirection='column' gap={3}>
                <TextInput label='Title' control={control} name='title' />
                <TextInput label='Description' control={control} name='description' />
                <DateTimeInput label='Date' control={control} name='startDate' defaultValue={startOfToday()} />
                {users && currentUser &&
                    <UserSelectInput
                        label='Add members'
                        control={control}
                        name='members'
                        users={users}
                        currentUser={currentUser}
                        defaultValue={[{userId: currentUser.id, displayName: currentUser.displayName}]}
                    />
                }
                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
                    <Button color="inherit" onClick={() => navigate(-1)}>Cancel</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={!isDirty || !isValid || isSubmitting}
                        size="large"
                    >
                        { id ? 'Save' : 'Create' }
                    </Button>
                </Box>
            </Box>
        </Paper>
    )
}