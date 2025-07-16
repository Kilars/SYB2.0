import { Box, Button, Card, CardActions, CardContent, CardHeader, Chip, Typography } from "@mui/material";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { useNavigate } from "react-router";
import { Event, Group, Person, SportsEsports } from "@mui/icons-material";
import { formatDate } from "../../lib/util/util";
import { Fragment } from "react/jsx-runtime";

export default function LeagueList() {
    const navigate = useNavigate();
    const { leagues, isLeaguesLoading } = useLeagues();
    const LEAGUE_STATUSES = [
        ['Planned', "warning"],
        ['Started', "success"],
        ['Finished', "info"],
    ];
    if (isLeaguesLoading) return <div>Loading ...</div>
    if (!leagues) return <div>No leagues found ...</div>

    return (
        <>
            <Typography variant='h2'>Leagues</Typography>
            {leagues.map(league => (
                <Card component={Box} key={league.id} p={3} m={1}>
                    <CardHeader title={league.title} action={
                        <Chip label={LEAGUE_STATUSES[league.status][0]} color={league.status === 0 ? 'warning' : league.status === 1 ? 'success' : 'info'} />
                    } />
                    <CardContent>
                        <Box>
                            <Typography fontWeight='bold'>
                                Description:
                            </Typography>
                            <Typography mb={2}>
                                {league.description}
                            </Typography>
                            <Box display='flex' alignItems='center'>
                                <SportsEsports sx={{ mr: 2 }} />
                                <Typography>Super Smash Bros</Typography>
                            </Box>
                            <Box display='flex' alignItems='center'>
                                <Event sx={{ mr: 2 }} />
                                <Typography>{formatDate(league.startDate)}</Typography>
                            </Box>
                            <Box display='flex' alignItems='center'>
                                <Group sx={{ mr: 2 }} />
                                <Typography>{league.members.length}</Typography>
                            </Box>
                            <Box display='flex' gap={2} mt={2}>
                                {league.members.map(member => (<Fragment key={member.id}>
                                    <Chip icon={<Person />} label={member.displayName} />
                                </Fragment>))}
                            </Box>
                        </Box>
                    </CardContent>
                    <CardActions>
                        <Button variant="contained" onClick={() => navigate(`/manage/${league.id}`)}>Edit league</Button>
                    </CardActions>
                </Card>
            ))}
        </>
    )
}