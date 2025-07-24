import { Box, Button, Card, CardHeader, Chip, Divider, Typography } from "@mui/material";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { useNavigate, useParams } from "react-router";
import { AccessTime, Edit, Group, Person, SportsEsports } from "@mui/icons-material";
import { formatDate } from "../../lib/util/util";
import { useAccount } from "../../lib/hooks/useAccount";
import StatusButton from "./StatusButton";

export default function LeagueDetails() {
    const LEAGUE_STATUSES = [
        ['Planned', "warning"],
        ['Started', "success"],
        ['Finished', "info"],
    ];
    const { id } = useParams();
    const { league, isLeagueLoading } = useLeagues(id);
    const { currentUser } = useAccount();
    const navigate = useNavigate();
    if (isLeagueLoading) return <Typography>Loading...</Typography>
    if (!league) return <Typography>No leagues found</Typography>
    return (
        <Box p={3}>
            <Box>
                <Box display='flex' width='100%' justifyContent='space-between' alignItems='center'>
                    <Typography variant="h3" fontWeight="bold" gutterBottom>
                        {league.title}
                    </Typography>

                    <Chip
                        label={LEAGUE_STATUSES[league.status][0]}
                        color={league.status === 0 ? 'warning' : league.status === 1 ? 'success' : 'info'}
                        sx={{ mb: 2 }}
                    />
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Description
                </Typography>
                <Typography variant="body1" gutterBottom>
                    {league.description}
                </Typography>

                <Box display="flex" alignItems="center" my={2}>
                    <SportsEsports sx={{ mr: 2 }} />
                    <Typography variant="body1">Super Smash Bros</Typography>
                </Box>

                <Box display="flex" alignItems="center" my={2}>
                    <AccessTime sx={{ mr: 2 }} />
                    <Typography variant="body1">{formatDate(league.startDate)}</Typography>
                </Box>

                <Box display="flex" alignItems="center" my={2}>
                    <Group sx={{ mr: 2 }} />
                    <Typography variant="body1">{league.members.length}</Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Members
                </Typography>

                <Box display="flex" flexWrap="wrap" gap={1}>
                    {league.members.map(member => (
                        <Chip
                            key={member.id}
                            icon={<Person />}
                            label={member.displayName}
                            color={member.isAdmin ? 'primary' : 'default'}
                        />
                    ))}
                </Box>
                <Box display='flex' width='100%' justifyContent='flex-end' pt={2}>
                    {currentUser && league.members.filter(m => m.isAdmin).map(x => x.userId).includes(currentUser.id) &&
                        <>
                            {league.status === 0 &&
                                <Button variant="contained" color="secondary" onClick={() => navigate(`/manage/${league.id}`)}>
                                    <Edit />
                                    <Typography variant="button" ml={1}>
                                        Edit league
                                    </Typography>
                                </Button>
                            }
                            <StatusButton leagueId={league.id} leagueStatus={league.status} />
                        </>
                    }
                </Box>
            </Box>
            <Box mt={4}>
                <Typography variant="h4" fontWeight="bold">Matches</Typography>
                {league.matches.length === 0
                    ? <Typography>No matches...</Typography>
                    :
                    <Box display='flex' flexDirection='column' gap={2}>
                        {league.matches.map(match => (
                        <Box component={Card} elevation={3} p={2} onClick={() => navigate(`/matches/${match.id}`)}>
                            <CardHeader action={<Chip label={match.completed ? 'Played' : 'Upcoming'} color={match.completed ? 'success' : 'primary'}></Chip>} />
                            <Box display='flex' flexDirection='row' justifyContent='center' alignItems='center' gap={2}>
                                <Typography variant="h3">{match.playerOne.displayName}</Typography>
                                <Typography variant="h4" fontStyle="italic">vs</Typography>
                                <Typography variant="h3">{match.playerTwo.displayName}</Typography>
                            </Box>
                            <Box>
                                <Typography> Match #{match.matchIndex} </Typography>
                                <Typography> Split {match.split} </Typography>
                                <Typography fontWeight="bold">
                                    Bo{match.rounds.length}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                    </Box>
                }
            </Box>
        </Box >
    )
}