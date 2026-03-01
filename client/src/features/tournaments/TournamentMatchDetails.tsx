import { useNavigate, useParams } from "react-router";
import { useTournamentMatch } from "../../lib/hooks/useTournamentMatch";
import { Box, Button, Card, CardContent, Paper, ToggleButton, ToggleButtonGroup, Typography, CircularProgress } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { ArrowBack, EmojiEvents, LockOpen } from "@mui/icons-material";
import CharacterSelect from "../matches/CharacterSelect";
import { tournamentMatchSchema } from "../../lib/schemas/tournamentSchema";
import { useEffect, useState } from "react";
import z from "zod/v4";
import { toast } from "react-toastify";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import EmptyState from "../../app/shared/components/EmptyState";
import { SMASH_COLORS } from "../../app/theme";
import { useAppTheme } from "../../app/context/ThemeContext";

export default function TournamentMatchDetails() {
    const { tournamentId, matchNumber } = useParams();
    const { match: matchData, isMatchLoading, completeMatch, reopenMatch } = useTournamentMatch(
        tournamentId || '', parseInt(matchNumber || '0')
    );
    const { meta } = useAppTheme();
    const navigate = useNavigate();
    const [rounds, setRounds] = useState(matchData?.rounds);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReopening, setIsReopening] = useState(false);

    useEffect(() => {
        setRounds(matchData?.rounds);
    }, [matchData]);

    const onSubmit = async () => {
        setIsSubmitting(true);
        try {
            tournamentMatchSchema.parse(rounds);
            if (rounds) await completeMatch.mutateAsync(rounds);
            toast('Match completed successfully!', { type: 'success' });
        } catch (error) {
            if (error instanceof z.ZodError) {
                for (const issue of error.issues) {
                    toast(issue.message, { type: 'error' });
                }
            } else {
                toast('Server error', { type: 'error' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const onReopen = async () => {
        setIsReopening(true);
        try {
            await reopenMatch.mutateAsync();
            toast('Match reopened', { type: 'info' });
        } catch {
            toast('Could not reopen match', { type: 'error' });
        } finally {
            setIsReopening(false);
        }
    };

    if (isMatchLoading) return <LoadingSkeleton variant="detail" />;
    if (!matchData || !rounds) return (
        <EmptyState
            icon={<EmojiEvents sx={{ fontSize: 48 }} />}
            message="Match not found"
        />
    );

    if (!matchData.playerOne || !matchData.playerTwo) return (
        <EmptyState
            icon={<EmojiEvents sx={{ fontSize: 48 }} />}
            message="Players haven't been determined yet"
        />
    );

    const getDisplayName = (player: TournamentPlayer) => player.isGuest ? `${player.displayName} (guest)` : player.displayName;
    const requiredWins = Math.ceil(rounds.length / 2);

    const playerOneScore = rounds.filter(r => r.winnerUserId === matchData.playerOne!.userId).length;
    const playerTwoScore = rounds.filter(r => r.winnerUserId === matchData.playerTwo!.userId).length;
    const matchDecided = playerOneScore >= requiredWins || playerTwoScore >= requiredWins;

    function getRoundStatus(round: TournamentRound): 'complete' | 'partial' | 'empty' {
        const filledFields = [
            round.playerOneCharacterId,
            round.playerTwoCharacterId,
            round.winnerUserId,
        ].filter(Boolean).length;
        if (filledFields === 3) return 'complete';
        if (filledFields > 0) return 'partial';
        return 'empty';
    }

    const ROUND_STATUS_COLORS = {
        complete: SMASH_COLORS.p4Green,
        partial: SMASH_COLORS.p3Yellow,
        empty: 'transparent',
    };

    return (
        <Box>
            <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate(`/tournaments/${tournamentId}`)}
                sx={{ mb: 2 }}
            >
                Back to Bracket
            </Button>

            <Typography variant="h4" mb={2} fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                {matchData.completed ? 'Match Result' : 'Register Match Result'}
            </Typography>

            {/* Match score indicator */}
            <Paper
                elevation={2}
                sx={{
                    p: 2, mb: 3, textAlign: 'center',
                    background: `linear-gradient(135deg, ${SMASH_COLORS.p1Red}15 0%, transparent 40%, ${SMASH_COLORS.p2Blue}15 100%)`,
                    overflow: 'hidden',
                }}
            >
                <Box display="flex" alignItems="center" justifyContent="center" gap={{ xs: 1, sm: 2 }} flexWrap="wrap">
                    <Typography
                        variant="h5"
                        fontWeight="bold"
                        noWrap
                        sx={{
                            color: playerOneScore > playerTwoScore ? SMASH_COLORS.p1Red : 'text.primary',
                            fontSize: { xs: '1rem', sm: '1.5rem' },
                            maxWidth: { xs: '30vw', sm: 'none' },
                        }}
                    >
                        {getDisplayName(matchData.playerOne)}
                    </Typography>
                    <Box sx={{
                        px: 2, py: 0.5,
                        borderRadius: 2,
                        background: meta.accentGradient,
                    }}>
                        <Typography variant="h5" fontWeight="bold" color="white">
                            {playerOneScore} — {playerTwoScore}
                        </Typography>
                    </Box>
                    <Typography
                        variant="h5"
                        fontWeight="bold"
                        noWrap
                        sx={{
                            color: playerTwoScore > playerOneScore ? SMASH_COLORS.p2Blue : 'text.primary',
                            fontSize: { xs: '1rem', sm: '1.5rem' },
                            maxWidth: { xs: '30vw', sm: 'none' },
                        }}
                    >
                        {getDisplayName(matchData.playerTwo)}
                    </Typography>
                </Box>
            </Paper>

            {/* Round progress dots */}
            <Box display="flex" justifyContent="center" gap={1} mb={3}>
                {rounds.map((round, i) => {
                    const status = getRoundStatus(round);
                    return (
                        <Box
                            key={i}
                            sx={{
                                width: 12, height: 12, borderRadius: '50%',
                                backgroundColor: ROUND_STATUS_COLORS[status],
                                border: `2px solid ${status === 'empty' ? '#ccc' : ROUND_STATUS_COLORS[status]}`,
                                transition: 'all 0.2s ease',
                            }}
                        />
                    );
                })}
            </Box>

            {/* Rounds */}
            {!matchData.completed && rounds.map((round, i) => {
                const roundStatus = getRoundStatus(round);
                const isDecidedEarly = matchDecided && !round.winnerUserId;
                const borderColor = ROUND_STATUS_COLORS[roundStatus];

                return (
                    <Card
                        key={round.tournamentId + round.matchNumber + round.roundNumber}
                        variant="outlined"
                        sx={{
                            opacity: isDecidedEarly ? 0.5 : 1,
                            mb: 2,
                            borderLeft: `4px solid ${borderColor}`,
                            transition: 'border-color 0.3s ease',
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="h5" fontWeight="bold">Round {round.roundNumber}</Typography>
                                {roundStatus === 'complete' && <CheckCircleOutlineIcon sx={{ color: SMASH_COLORS.p4Green }} />}
                                {roundStatus === 'partial' && <WarningAmberIcon sx={{ color: SMASH_COLORS.p3Yellow }} />}
                                {isDecidedEarly && (
                                    <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>
                                        Match already decided
                                    </Typography>
                                )}
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" sx={{ color: SMASH_COLORS.p1Red }}>
                                        {getDisplayName(matchData.playerOne!)}
                                    </Typography>
                                    <CharacterSelect
                                        onChange={id =>
                                            setRounds(prev =>
                                                prev?.map((r, index) =>
                                                    index === i ? { ...r, playerOneCharacterId: id } : r
                                                )
                                            )
                                        }
                                        selectedId={round.playerOneCharacterId}
                                    />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" sx={{ color: SMASH_COLORS.p2Blue }}>
                                        {getDisplayName(matchData.playerTwo!)}
                                    </Typography>
                                    <CharacterSelect
                                        onChange={id =>
                                            setRounds(prev =>
                                                prev?.map((r, index) =>
                                                    index === i ? { ...r, playerTwoCharacterId: id } : r
                                                )
                                            )
                                        }
                                        selectedId={round.playerTwoCharacterId}
                                    />
                                </Box>
                            </Box>

                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary', fontWeight: 600 }}>
                                    Who won Round {round.roundNumber}?
                                </Typography>
                                <ToggleButtonGroup
                                    exclusive
                                    fullWidth
                                    value={round.winnerUserId ?? null}
                                    onChange={(_, newValue) => {
                                        setRounds(prev =>
                                            prev?.map((r, idx) =>
                                                idx === i ? { ...r, winnerUserId: newValue ?? undefined } : r
                                            )
                                        );
                                    }}
                                    aria-label={`Round ${round.roundNumber} winner selection`}
                                    sx={{ '& .Mui-selected': { fontWeight: 'bold' } }}
                                >
                                    <ToggleButton
                                        value={matchData.playerOne!.userId}
                                        aria-label={`${getDisplayName(matchData.playerOne!)} wins round ${round.roundNumber}`}
                                        sx={{
                                            '&.Mui-selected': {
                                                backgroundColor: `${SMASH_COLORS.p1Red}22`,
                                                borderColor: SMASH_COLORS.p1Red,
                                                color: SMASH_COLORS.p1Red,
                                            },
                                        }}
                                    >
                                        {getDisplayName(matchData.playerOne!)}
                                    </ToggleButton>
                                    <ToggleButton
                                        value={matchData.playerTwo!.userId}
                                        aria-label={`${getDisplayName(matchData.playerTwo!)} wins round ${round.roundNumber}`}
                                        sx={{
                                            '&.Mui-selected': {
                                                backgroundColor: `${SMASH_COLORS.p2Blue}22`,
                                                borderColor: SMASH_COLORS.p2Blue,
                                                color: SMASH_COLORS.p2Blue,
                                            },
                                        }}
                                    >
                                        {getDisplayName(matchData.playerTwo!)}
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Box>
                        </CardContent>
                    </Card>
                );
            })}

            {/* Submit/Reopen buttons */}
            {!matchData.completed ? (
                <Button
                    variant="contained"
                    fullWidth
                    sx={{
                        mt: 3, py: 1.5,
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        background: meta.accentGradient,
                        color: 'white',
                        '&:hover': { opacity: 0.85 },
                    }}
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
                    onClick={onSubmit}
                >
                    {isSubmitting ? 'Completing...' : 'Complete Match'}
                </Button>
            ) : (
                <Button
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 3, py: 1.5 }}
                    disabled={isReopening}
                    startIcon={isReopening ? <CircularProgress size={20} /> : <LockOpen />}
                    onClick={onReopen}
                >
                    {isReopening ? 'Reopening...' : 'Reopen Match'}
                </Button>
            )}
        </Box>
    );
}
