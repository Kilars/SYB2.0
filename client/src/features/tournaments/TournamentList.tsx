import { Box, Button, Card, CardActions, CardContent, CardHeader, Chip, Typography } from "@mui/material";
import { useTournaments } from "../../lib/hooks/useTournaments";
import { Link as RouterLink, useNavigate } from "react-router";
import { AccessTime, Add, EmojiEvents, Group, Visibility } from "@mui/icons-material";
import { formatDate } from "../../lib/util/util";
import { useAccount } from "../../lib/hooks/useAccount";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import EmptyState from "../../app/shared/components/EmptyState";
import { SMASH_COLORS } from "../../app/theme";
import { useAppTheme } from "../../app/context/ThemeContext";

const STATUS_LABELS = ['Planned', 'Active', 'Complete'] as const;
const STATUS_BORDERS = [SMASH_COLORS.p3Yellow, SMASH_COLORS.p4Green, SMASH_COLORS.p2Blue];

export default function TournamentList() {
    const navigate = useNavigate();
    const { tournaments, isTournamentsLoading } = useTournaments();
    const { currentUser } = useAccount();
    const { meta } = useAppTheme();

    if (isTournamentsLoading) return <LoadingSkeleton variant="list" count={3} />;
    if (!tournaments || tournaments.length === 0) return (
        <EmptyState
            icon={<EmojiEvents sx={{ fontSize: 48 }} />}
            message="No tournaments yet — create one to get started!"
            action={{ label: "Create Tournament", href: "/createTournament" }}
        />
    );

    return (
        <>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant='h2'>Tournaments</Typography>
                {currentUser && (
                    <Button
                        variant="contained"
                        component={RouterLink}
                        to="/createTournament"
                        startIcon={<Add />}
                        sx={{
                            background: meta.accentGradient,
                            color: 'white',
                            '&:hover': { opacity: 0.85 },
                        }}
                    >
                        Create Tournament
                    </Button>
                )}
            </Box>
            {tournaments.map(tournament => {
                const completedMatches = tournament.matches.filter(m => m.completed).length;
                const totalMatches = tournament.matches.length;

                return (
                    <Card
                        component={Box}
                        key={tournament.id}
                        p={1}
                        m={1}
                        role="article"
                        aria-label={`Tournament: ${tournament.title} — ${STATUS_LABELS[tournament.status]}`}
                        sx={{
                            borderLeft: `4px solid ${STATUS_BORDERS[tournament.status]}`,
                            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                            },
                        }}
                    >
                        <CardHeader
                            title={tournament.title}
                            titleTypographyProps={{ fontWeight: 'bold' }}
                            action={
                                <Chip
                                    label={STATUS_LABELS[tournament.status]}
                                    color={tournament.status === 0 ? 'warning' : tournament.status === 1 ? 'success' : 'info'}
                                    sx={{ fontWeight: 'bold' }}
                                />
                            }
                        />
                        <CardContent>
                            <Box>
                                <Typography fontWeight='bold'>Description:</Typography>
                                <Typography mb={2}>{tournament.description}</Typography>
                                <Box display='flex' alignItems='center' gap={1} mb={0.5}>
                                    <EmojiEvents sx={{ color: 'warning.main' }} />
                                    <Typography>Best of {tournament.bestOf} · Single Elimination</Typography>
                                </Box>
                                <Box display='flex' alignItems='center' gap={1} mb={0.5}>
                                    <AccessTime sx={{ color: 'info.main' }} />
                                    <Typography>{formatDate(tournament.startDate)}</Typography>
                                </Box>
                                <Box display='flex' alignItems='center' gap={1} mb={0.5}>
                                    <Group sx={{ color: 'success.main' }} />
                                    <Typography>{tournament.playerCount} players</Typography>
                                </Box>
                                {totalMatches > 0 && (
                                    <Typography variant="body2" color="text.secondary" mt={1}>
                                        {completedMatches}/{totalMatches} matches completed
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                        <CardActions>
                            <Box gap={1} display='flex' justifyContent='flex-end' width='100%' flexWrap='wrap'>
                                <Button variant="contained" onClick={() => navigate(`/tournaments/${tournament.id}`)}>
                                    <Visibility />
                                    <Typography variant="button" ml={1}>View Bracket</Typography>
                                </Button>
                            </Box>
                        </CardActions>
                    </Card>
                );
            })}
        </>
    );
}
