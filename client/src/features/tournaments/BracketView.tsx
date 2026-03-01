import { Box, Button, Card, Chip, Paper, Typography, CircularProgress } from "@mui/material";
import { useNavigate, useParams } from "react-router";
import { useTournaments } from "../../lib/hooks/useTournaments";
import { EmojiEvents, Shuffle, PlayArrow } from "@mui/icons-material";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import EmptyState from "../../app/shared/components/EmptyState";
import { SMASH_COLORS } from "../../app/theme";
import { useAppTheme } from "../../app/context/ThemeContext";
import { useAccount } from "../../lib/hooks/useAccount";
import { useState } from "react";

const ROUND_LABELS: Record<number, string> = {
    1: 'Round 1',
    2: 'Round 2',
    3: 'Quarterfinals',
    4: 'Semifinals',
    5: 'Final',
};

function getRoundLabel(bracketRound: number, totalRounds: number): string {
    const roundsFromEnd = totalRounds - bracketRound;
    if (roundsFromEnd === 0) return 'Final';
    if (roundsFromEnd === 1) return 'Semifinals';
    if (roundsFromEnd === 2) return 'Quarterfinals';
    return ROUND_LABELS[bracketRound] || `Round ${bracketRound}`;
}

interface BracketMatchCardProps {
    match: TournamentMatch;
    tournamentId: string;
    onClick: () => void;
}

function BracketMatchCard({ match, onClick }: BracketMatchCardProps) {
    const getPlayerName = (player?: TournamentPlayer) => {
        if (!player) return 'TBD';
        return player.isGuest ? `${player.displayName} (guest)` : player.displayName;
    };

    const isP1Winner = match.completed && match.winnerUserId === match.playerOne?.userId;
    const isP2Winner = match.completed && match.winnerUserId === match.playerTwo?.userId;
    const canPlay = match.playerOne && match.playerTwo && !match.completed;

    const p1Wins = match.rounds.filter(r => r.winnerUserId === match.playerOne?.userId).length;
    const p2Wins = match.rounds.filter(r => r.winnerUserId === match.playerTwo?.userId).length;

    return (
        <Card
            onClick={match.playerOne && match.playerTwo ? onClick : undefined}
            sx={{
                minWidth: { xs: 180, sm: 220 },
                maxWidth: 260,
                cursor: match.playerOne && match.playerTwo ? 'pointer' : 'default',
                border: match.completed ? `2px solid ${SMASH_COLORS.p4Green}` : canPlay ? `2px solid ${SMASH_COLORS.p2Blue}` : '1px solid',
                borderColor: match.completed ? SMASH_COLORS.p4Green : canPlay ? SMASH_COLORS.p2Blue : 'divider',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': match.playerOne && match.playerTwo ? {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                } : {},
                opacity: !match.playerOne && !match.playerTwo ? 0.5 : 1,
            }}
        >
            <Box sx={{ p: 1 }}>
                {/* Player 1 */}
                <Box sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    py: 0.75, px: 1,
                    borderRadius: 1,
                    backgroundColor: isP1Winner ? `${SMASH_COLORS.p4Green}15` : 'transparent',
                }}>
                    <Typography
                        variant="body2"
                        noWrap
                        sx={{
                            fontWeight: isP1Winner ? 'bold' : 'normal',
                            color: !match.playerOne ? 'text.disabled' : isP1Winner ? SMASH_COLORS.p4Green : 'text.primary',
                            flex: 1,
                            minWidth: 0,
                        }}
                    >
                        {getPlayerName(match.playerOne)}
                    </Typography>
                    {match.completed && (
                        <Typography variant="body2" fontWeight="bold" sx={{ ml: 1, color: isP1Winner ? SMASH_COLORS.p4Green : 'text.secondary' }}>
                            {p1Wins}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />

                {/* Player 2 */}
                <Box sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    py: 0.75, px: 1,
                    borderRadius: 1,
                    backgroundColor: isP2Winner ? `${SMASH_COLORS.p4Green}15` : 'transparent',
                }}>
                    <Typography
                        variant="body2"
                        noWrap
                        sx={{
                            fontWeight: isP2Winner ? 'bold' : 'normal',
                            color: !match.playerTwo ? 'text.disabled' : isP2Winner ? SMASH_COLORS.p4Green : 'text.primary',
                            flex: 1,
                            minWidth: 0,
                        }}
                    >
                        {getPlayerName(match.playerTwo)}
                    </Typography>
                    {match.completed && (
                        <Typography variant="body2" fontWeight="bold" sx={{ ml: 1, color: isP2Winner ? SMASH_COLORS.p4Green : 'text.secondary' }}>
                            {p2Wins}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Card>
    );
}

export default function BracketView() {
    const { tournamentId } = useParams();
    const { tournament, isTournamentLoading, startTournament, shuffleBracket } = useTournaments(tournamentId);
    const { currentUser } = useAccount();
    const { meta } = useAppTheme();
    const navigate = useNavigate();
    const [isStarting, setIsStarting] = useState(false);
    const [isShuffling, setIsShuffling] = useState(false);

    if (isTournamentLoading) return <LoadingSkeleton variant="detail" />;
    if (!tournament) return (
        <EmptyState
            icon={<EmojiEvents sx={{ fontSize: 48 }} />}
            message="Tournament not found"
        />
    );

    const isAdmin = currentUser && tournament.members.some(m => m.userId === currentUser.id && m.isAdmin);
    const totalRounds = Math.log2(tournament.playerCount);

    // Group matches by bracket round
    const matchesByRound: Record<number, TournamentMatch[]> = {};
    for (const match of tournament.matches) {
        if (!matchesByRound[match.bracketRound]) matchesByRound[match.bracketRound] = [];
        matchesByRound[match.bracketRound].push(match);
    }
    // Sort within each round by bracket position
    for (const round in matchesByRound) {
        matchesByRound[round].sort((a, b) => a.bracketPosition - b.bracketPosition);
    }

    const handleStart = async () => {
        setIsStarting(true);
        try {
            await startTournament.mutateAsync();
        } finally {
            setIsStarting(false);
        }
    };

    const handleShuffle = async () => {
        setIsShuffling(true);
        try {
            await shuffleBracket.mutateAsync();
        } finally {
            setIsShuffling(false);
        }
    };

    const canShuffle = tournament.status === 1 && !tournament.matches.some(m => m.completed);

    // Winner banner
    const winner = tournament.winnerUserId
        ? tournament.members.find(m => m.userId === tournament.winnerUserId)
        : null;

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                        {tournament.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">{tournament.description}</Typography>
                    <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                        <Chip
                            label={['Planned', 'Active', 'Complete'][tournament.status]}
                            color={tournament.status === 0 ? 'warning' : tournament.status === 1 ? 'success' : 'info'}
                            sx={{ fontWeight: 'bold' }}
                        />
                        <Chip label={`Best of ${tournament.bestOf}`} variant="outlined" />
                        <Chip label={`${tournament.playerCount} players`} variant="outlined" />
                    </Box>
                </Box>
                <Box display="flex" gap={1} flexWrap="wrap">
                    {isAdmin && tournament.status === 0 && (
                        <Button
                            variant="contained"
                            startIcon={isStarting ? <CircularProgress size={20} /> : <PlayArrow />}
                            disabled={isStarting}
                            onClick={handleStart}
                            sx={{
                                background: meta.accentGradient,
                                color: 'white',
                                '&:hover': { opacity: 0.85 },
                            }}
                        >
                            {isStarting ? 'Starting...' : 'Start Tournament'}
                        </Button>
                    )}
                    {isAdmin && canShuffle && (
                        <Button
                            variant="outlined"
                            startIcon={isShuffling ? <CircularProgress size={20} /> : <Shuffle />}
                            disabled={isShuffling}
                            onClick={handleShuffle}
                        >
                            {isShuffling ? 'Shuffling...' : 'Shuffle Bracket'}
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Winner banner */}
            {winner && (
                <Paper
                    elevation={3}
                    sx={{
                        p: 3, mb: 3, textAlign: 'center',
                        background: meta.heroGradient,
                        color: 'white',
                        borderRadius: 2,
                    }}
                >
                    <EmojiEvents sx={{ fontSize: 48, color: SMASH_COLORS.gold }} />
                    <Typography variant="h5" fontWeight="bold" mt={1}>
                        {winner.displayName} wins!
                    </Typography>
                </Paper>
            )}

            {/* Planned state: show member list */}
            {tournament.status === 0 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="bold" mb={2}>Players ({tournament.members.length})</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 1 }}>
                        {tournament.members.map(member => (
                            <Chip
                                key={member.userId}
                                label={`${member.displayName}${member.isGuest ? ' (guest)' : ''}${member.isAdmin ? ' ★' : ''}`}
                                variant="outlined"
                            />
                        ))}
                    </Box>
                </Paper>
            )}

            {/* Active/Complete: show bracket */}
            {tournament.status > 0 && (
                <Box
                    sx={{
                        overflowX: 'auto',
                        pb: 2,
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            gap: { xs: 2, sm: 4 },
                            minWidth: 'fit-content',
                            alignItems: 'stretch',
                        }}
                    >
                        {Array.from({ length: totalRounds }, (_, i) => i + 1).map(bracketRound => {
                            const matches = matchesByRound[bracketRound] || [];
                            const roundLabel = getRoundLabel(bracketRound, totalRounds);

                            return (
                                <Box
                                    key={bracketRound}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 0,
                                        minWidth: { xs: 200, sm: 240 },
                                    }}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight="bold"
                                        textAlign="center"
                                        sx={{
                                            mb: 2,
                                            py: 0.5,
                                            px: 2,
                                            borderRadius: 1,
                                            backgroundColor: 'action.hover',
                                        }}
                                    >
                                        {roundLabel}
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-around',
                                            flex: 1,
                                            gap: 2,
                                        }}
                                    >
                                        {matches.map(match => (
                                            <BracketMatchCard
                                                key={match.matchNumber}
                                                match={match}
                                                tournamentId={tournament.id}
                                                onClick={() => navigate(`/tournaments/${tournament.id}/match/${match.matchNumber}`)}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            )}
        </Box>
    );
}
