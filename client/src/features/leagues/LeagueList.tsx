import { Box, Button, Card, CardActions, CardContent, CardHeader, Chip, Typography } from "@mui/material";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { Link as RouterLink, useNavigate } from "react-router";
import { AccessTime, Add, Edit, Group, SportsEsports, Visibility } from "@mui/icons-material";
import { formatDate } from "../../lib/util/util";
import { useAccount } from "../../lib/hooks/useAccount";
import { LEAGUE_STATUSES } from "../../lib/util/constants";
import UserChip from "../../app/shared/components/UserChip";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import EmptyState from "../../app/shared/components/EmptyState";
import { SMASH_COLORS } from "../../app/theme";

const STATUS_BORDERS = [SMASH_COLORS.p3Yellow, SMASH_COLORS.p4Green, SMASH_COLORS.p2Blue];

export default function LeagueList() {
    const navigate = useNavigate();
    const { leagues, isLeaguesLoading } = useLeagues();
    const { currentUser } = useAccount();
    if (isLeaguesLoading) return <LoadingSkeleton variant="list" count={3} />
    if (!leagues || leagues.length === 0) return (
        <EmptyState
            icon={<SportsEsports sx={{ fontSize: 48 }} />}
            message="No leagues yet — create one to get started!"
            action={{ label: "Create League", href: "/createLeague" }}
        />
    )

    return (
        <>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant='h2'>Leagues</Typography>
                {currentUser && (
                    <Button
                        variant="contained"
                        component={RouterLink}
                        to="/createLeague"
                        startIcon={<Add />}
                        sx={{
                            background: `linear-gradient(135deg, ${SMASH_COLORS.p1Red}, ${SMASH_COLORS.p2Blue})`,
                            '&:hover': { background: `linear-gradient(135deg, ${SMASH_COLORS.p1Red}cc, ${SMASH_COLORS.p2Blue}cc)` },
                        }}
                    >
                        Create League
                    </Button>
                )}
            </Box>
            {leagues.map(league => (
                <Card
                    component={Box}
                    key={league.id}
                    p={1}
                    m={1}
                    sx={{
                        borderLeft: `4px solid ${STATUS_BORDERS[league.status]}`,
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        },
                    }}
                >
                    <CardHeader
                        title={league.title}
                        titleTypographyProps={{ fontWeight: 'bold' }}
                        action={
                            <Chip
                                label={LEAGUE_STATUSES[league.status][0]}
                                color={league.status === 0 ? 'warning' : league.status === 1 ? 'success' : 'info'}
                                sx={{ fontWeight: 'bold' }}
                            />
                        }
                    />
                    <CardContent>
                        <Box>
                            <Typography fontWeight='bold'>
                                Description:
                            </Typography>
                            <Typography mb={2}>
                                {league.description}
                            </Typography>
                            <Box display='flex' alignItems='center'>
                                <SportsEsports sx={{ mr: 2, color: SMASH_COLORS.p1Red }} />
                                <Typography>Super Smash Bros</Typography>
                            </Box>
                            <Box display='flex' alignItems='center'>
                                <AccessTime sx={{ mr: 2, color: SMASH_COLORS.p2Blue }} />
                                <Typography>{formatDate(league.startDate)}</Typography>
                            </Box>
                            <Box display='flex' alignItems='center'>
                                <Group sx={{ mr: 2, color: SMASH_COLORS.p4Green }} />
                                <Typography>{league.members.length} players</Typography>
                            </Box>
                            <Box gap={1} mt={1} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' } }}>
                                {league.members.map(member =>
                                    <UserChip key={member.userId} userId={member.userId} displayName={member.displayName} />
                                )}
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
