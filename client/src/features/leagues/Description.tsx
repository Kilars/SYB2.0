import { AccessTime, Group, SportsEsports } from "@mui/icons-material";
import { Box, Chip, LinearProgress, Paper, Typography } from "@mui/material";
import { useParams } from "react-router";
import { formatDate } from "../../lib/util/util";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { LEAGUE_STATUSES } from "../../lib/util/constants";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import EmptyState from "../../app/shared/components/EmptyState";
import { SMASH_COLORS } from "../../app/theme";

const STATUS_COLORS = [SMASH_COLORS.p3Yellow, SMASH_COLORS.p4Green, SMASH_COLORS.p2Blue];

export default function Description() {
    const { leagueId } = useParams();
    const { league, isLeagueLoading } = useLeagues(leagueId);
    if (isLeagueLoading) return <LoadingSkeleton variant="detail" />
    if (!league) return (
        <EmptyState
            icon={<SportsEsports sx={{ fontSize: 48 }} />}
            message="League not found"
        />
    )

    const completedMatches = league.matches.filter(m => m.completed).length;
    const totalMatches = league.matches.length;
    const progressPercent = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

    return (
        <Box>
            <Box display='flex' width='100%' justifyContent='space-between' alignItems='center'>
                <Chip
                    label={LEAGUE_STATUSES[league.status][0]}
                    color={league.status === 0 ? 'warning' : league.status === 1 ? 'success' : 'info'}
                    sx={{ mb: 2, fontWeight: 'bold' }}
                />
            </Box>
            <Typography variant="body1" gutterBottom>
                {league.description}
            </Typography>

            <Box display="flex" gap={3} sx={{ flexWrap: 'wrap' }}>
                <Box display="flex" alignItems="center" my={2}>
                    <SportsEsports sx={{ mr: 2, color: SMASH_COLORS.p1Red }} />
                    <Typography variant="body1">Super Smash Bros</Typography>
                </Box>
                <Box display="flex" alignItems="center" my={2}>
                    <AccessTime sx={{ mr: 2, color: SMASH_COLORS.p2Blue }} />
                    <Typography variant="body1">{formatDate(league.startDate)}</Typography>
                </Box>
                <Box display="flex" alignItems="center" my={2}>
                    <Group sx={{ mr: 2, color: SMASH_COLORS.p4Green }} />
                    <Typography variant="body1">{league.members.length} players</Typography>
                </Box>
            </Box>

            {/* Match completion progress */}
            {totalMatches > 0 && (
                <Paper
                    elevation={1}
                    sx={{
                        p: 2, mt: 2,
                        border: `1px solid ${STATUS_COLORS[league.status]}33`,
                        borderRadius: 2,
                    }}
                >
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" fontWeight="bold">
                            Match Progress
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ color: STATUS_COLORS[league.status] }}>
                            {completedMatches} / {totalMatches} ({progressPercent}%)
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={progressPercent}
                        sx={{
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 5,
                                background: `linear-gradient(90deg, ${SMASH_COLORS.p1Red}, ${SMASH_COLORS.p4Green})`,
                            },
                        }}
                    />
                </Paper>
            )}
        </Box>
    )
}
