import { Box, Button, Card, CardActions, CardContent, CardHeader, Chip, Typography } from "@mui/material";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { useNavigate } from "react-router";
import { AccessTime, Edit, Group, Person, SportsEsports, Visibility } from "@mui/icons-material";
import { formatDate } from "../../lib/util/util";
import { Fragment } from "react/jsx-runtime";
import { useAccount } from "../../lib/hooks/useAccount";

export default function LeagueList() {
    const navigate = useNavigate();
    const { leagues, isLeaguesLoading } = useLeagues();
    const { currentUser } = useAccount();
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
                                <AccessTime sx={{ mr: 2 }} />
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
                        <Box gap={2} display='flex' justifyContent='flex-end' width='100%'>
                            {currentUser && league.members.filter(m => m.isAdmin).map(x => x.userId).includes(currentUser.id) && league.status == 0 &&
                                <Button variant="contained" color="secondary" onClick={() => navigate(`/manage/${league.id}/leaderboard`)}>
                                    <Edit />
                                    <Typography variant="button" ml={1}>
                                        Edit league
                                    </Typography>
                                </Button>
                            }
                            <Button variant="contained" onClick={() => navigate(`/leagues/${league.id}/leaderboard`)}>
                                <Visibility />
                                <Typography variant="button" ml={1}>
                                    View
                                </Typography>
                            </Button>
                        </Box>
                    </CardActions>
                </Card>
            ))}
        </>
    )
}