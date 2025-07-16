import { Box, Button, Chip, Divider, Paper, Typography } from "@mui/material";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { useNavigate, useParams } from "react-router";
import { AccessTime, Edit, Group, Person, SportsEsports } from "@mui/icons-material";
import { formatDate } from "../../lib/util/util";
import { useAccount } from "../../lib/hooks/useAccount";

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
        <Box p={4} component={Paper} elevation={3} sx={{ maxWidth: '900px', margin: '0 auto' }}>
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
            <Box display='flex' width='100%' justifyContent='flex-end'>
                {currentUser && league.members.filter(m => m.isAdmin).map(x => x.userId).includes(currentUser.id) &&
                    <Button variant="contained" color="secondary" onClick={() => navigate(`/manage/${league.id}`)}>
                        <Edit />
                        <Typography variant="button" ml={1}>
                            Edit league
                        </Typography>
                    </Button>
                }
            </Box>
        </Box>
    )
}