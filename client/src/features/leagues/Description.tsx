import { AccessTime, Group, SportsEsports } from "@mui/icons-material";
import { Box, Chip, Typography } from "@mui/material";
import { useParams } from "react-router";
import { formatDate } from "../../lib/util/util";
import { useLeagues } from "../../lib/hooks/useLeagues";

export default function Description() {
    const LEAGUE_STATUSES = [
        ['Planned', "warning"],
        ['Started', "success"],
        ['Finished', "info"],
    ];
    const { leagueId } = useParams();
    const { league, isLeagueLoading } = useLeagues(leagueId);
    if (isLeagueLoading) return <Typography>Loading...</Typography>
    if (!league) return <Typography>No leagues found</Typography>
    return (
        <Box>
            <Box display='flex' width='100%' justifyContent='space-between' alignItems='center'>
                <Chip
                    label={LEAGUE_STATUSES[league.status][0]}
                    color={league.status === 0 ? 'warning' : league.status === 1 ? 'success' : 'info'}
                    sx={{ mb: 2 }}
                />
            </Box>
            <Typography variant="body1" gutterBottom>
                {league.description}
            </Typography>

            <Box display="flex" gap={3}>
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
            </Box>
        </Box>
    )
}
