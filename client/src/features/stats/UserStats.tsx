import { Avatar, Box, Button, Card, CardContent, Paper, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router";
import { useUserMatches } from "../../lib/hooks/useUserMatches";
import { useCharacters } from "../../lib/hooks/useCharacters";
import { BarChart, CheckCircle, Cancel, EmojiEvents, SportsMma, AutoAwesome, ThumbUp, ThumbDown } from "@mui/icons-material";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import EmptyState from "../../app/shared/components/EmptyState";
import { SMASH_COLORS } from "../../app/theme";

const CHAR_COLORS = [
  SMASH_COLORS.p1Red, SMASH_COLORS.p2Blue, SMASH_COLORS.p3Yellow, SMASH_COLORS.p4Green,
  '#AB47BC', '#FF7043', '#26C6DA', '#8D6E63',
];

const PODIUM_COLORS = [SMASH_COLORS.gold, SMASH_COLORS.silver, SMASH_COLORS.bronze];

export default function UserStats() {
    const { userId } = useParams();
    const { characters, charactersIsLoading } = useCharacters();
    const navigate = useNavigate();
    const { userMatches, isUserMatchesLoading } = useUserMatches(userId || '');

    if (isUserMatchesLoading || charactersIsLoading) return <LoadingSkeleton variant="card" count={3} />
    if (!userId || !userMatches || userMatches.length == 0 || !characters) return (
        <EmptyState
            icon={<BarChart sx={{ fontSize: 48 }} />}
            message="Play some matches to see your stats!"
        />
    )

    const stats = userMatches
        .flatMap(match =>
            match.rounds
                .map(round => {
                    const charId = match.playerOne.userId === userId ? round.playerOneCharacterId as string : round.playerTwoCharacterId as string;
                    const won = round.winnerUserId === userId;
                    return {
                        charId,
                        won
                    }
                })
        );
    const charStats: Record<string, { wins: number; total: number; wr: number }> = {};

    for (const stat of stats) {
        if (!stat.charId) continue;
        if (charStats[stat.charId] === undefined) {
            charStats[stat.charId] = { wins: stat.won ? 1 : 0, total: 1, wr: stat.won ? 100 : 0 }
        } else {
            const newWins = charStats[stat.charId].wins + (stat.won ? 1 : 0);
            const newTotal = charStats[stat.charId].total + 1;
            charStats[stat.charId] = {
                wins: newWins,
                total: newTotal,
                wr: Math.round((newWins * 100) / newTotal)
            }
        }
    }

    return (
        <Box>
            <Typography variant="h4" mb={2}>Top characters</Typography>
            {(() => {
                const topChars = Object.entries(charStats)
                    .filter(([_, stats]) => stats.total > 2)
                    .sort((a, b) => b[1].total - a[1].total)
                    .sort((a, b) => b[1].wr - a[1].wr)
                    .slice(0, 3);
                if (topChars.length === 0) {
                    return (
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            No character data yet — play some matches!
                        </Typography>
                    );
                }
                return (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
                        {topChars.map(([charId, stats], i) => {
                            const character = characters.find(c => c.id === charId);
                            return (
                                <Card key={charId} sx={{
                                    border: `2px solid ${PODIUM_COLORS[i] || 'transparent'}`,
                                    boxShadow: i === 0 ? `0 0 12px ${SMASH_COLORS.gold}44` : undefined,
                                }}>
                                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar
                                            src={character?.imageUrl}
                                            alt={character?.fullName ?? 'Unknown'}
                                            sx={{
                                                width: 64, height: 64,
                                                border: `3px solid ${PODIUM_COLORS[i] || SMASH_COLORS.p2Blue}`,
                                            }}
                                        />
                                        <Box>
                                            <Typography fontWeight="bold">{character?.fullName ?? 'Unknown'}</Typography>
                                            <Typography variant="body2">
                                                Wins: <Box component="span" sx={{ color: SMASH_COLORS.p4Green, fontWeight: 600 }}>{stats.wins}</Box> / Total: {stats.total}
                                            </Typography>
                                            <Typography variant="body2">
                                                Win rate: <Box component="span" sx={{
                                                    color: stats.wr >= 60 ? SMASH_COLORS.p4Green : stats.wr <= 40 ? SMASH_COLORS.p1Red : 'text.primary',
                                                    fontWeight: 600,
                                                }}>{stats.wr}%</Box>
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Box>
                );
            })()}

            {/* Overall Stats Summary */}
            {(() => {
                const totalWins = userMatches.filter(m => m.completed && m.winnerUserId === userId).length;
                const totalLosses = userMatches.filter(m => m.completed && m.winnerUserId && m.winnerUserId !== userId).length;
                const totalPlayed = totalWins + totalLosses;
                const overallWR = totalPlayed === 0 ? 0 : Math.round((totalWins * 100) / totalPlayed);
                const flawless = userMatches.filter(m => {
                    if (!m.completed || m.winnerUserId !== userId) return false;
                    const roundsWithWinner = m.rounds.filter(r => r.winnerUserId);
                    return roundsWithWinner.length === 2;
                }).length;
                const statCards = [
                    { label: 'Wins', value: totalWins, icon: <EmojiEvents />, color: SMASH_COLORS.p4Green },
                    { label: 'Losses', value: totalLosses, icon: <SportsMma />, color: SMASH_COLORS.p1Red },
                    { label: 'Win Rate', value: `${overallWR}%`, icon: <BarChart />, color: SMASH_COLORS.p2Blue },
                    { label: 'Flawless', value: flawless, icon: <AutoAwesome />, color: SMASH_COLORS.gold },
                ];
                return (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
                        {statCards.map(card => (
                            <Paper key={card.label} elevation={2} sx={{
                                p: 2, textAlign: 'center', borderRadius: 2,
                                borderTop: `3px solid ${card.color}`,
                            }}>
                                <Box sx={{ color: card.color, mb: 0.5 }}>{card.icon}</Box>
                                <Typography variant="h5" fontWeight="bold">{card.value}</Typography>
                                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                            </Paper>
                        ))}
                    </Box>
                );
            })()}

            {/* Character Usage Pie Chart */}
            {Object.keys(charStats).length > 0 && (
                <Box mb={3}>
                    <Typography variant="h5" mb={2} fontWeight="bold">Character Usage</Typography>
                    <Box sx={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={Object.entries(charStats)
                                        .sort((a, b) => b[1].total - a[1].total)
                                        .map(([charId, s]) => ({
                                            name: characters.find(c => c.id === charId)?.shorthandName || 'Unknown',
                                            value: s.total,
                                        }))}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={90}
                                    innerRadius={30}
                                    paddingAngle={2}
                                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                    labelLine={true}
                                >
                                    {Object.entries(charStats)
                                        .sort((a, b) => b[1].total - a[1].total)
                                        .map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={CHAR_COLORS[index % CHAR_COLORS.length]} stroke="#fff" strokeWidth={2} />
                                        ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => [`${value} rounds`]}
                                    contentStyle={{ borderRadius: 8, border: '1px solid #ddd' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>
                </Box>
            )}

            {/* Best & Worst Character Matchups */}
            {(() => {
                const opponentCharStats: Record<string, { wins: number; total: number }> = {};
                userMatches.flatMap(match =>
                    match.rounds.filter(round => round.completed).map(round => {
                        const isPlayerOne = match.playerOne.userId === userId;
                        const opponentCharId = isPlayerOne ? round.playerTwoCharacterId : round.playerOneCharacterId;
                        const won = round.winnerUserId === userId;
                        return { opponentCharId, won };
                    })
                ).forEach(({ opponentCharId, won }) => {
                    if (!opponentCharId) return;
                    if (!opponentCharStats[opponentCharId]) opponentCharStats[opponentCharId] = { wins: 0, total: 0 };
                    opponentCharStats[opponentCharId].total += 1;
                    if (won) opponentCharStats[opponentCharId].wins += 1;
                });

                const matchups = Object.entries(opponentCharStats)
                    .filter(([, s]) => s.total >= 3)
                    .map(([charId, s]) => {
                        const char = characters.find(c => c.id === charId);
                        return {
                            charId,
                            name: char?.fullName || 'Unknown',
                            shortName: char?.shorthandName || '??',
                            imageUrl: char?.imageUrl || '',
                            wins: s.wins,
                            losses: s.total - s.wins,
                            total: s.total,
                            wr: Math.round((s.wins * 100) / s.total),
                        };
                    });

                const best = [...matchups].sort((a, b) => b.wr - a.wr || b.total - a.total).slice(0, 3);
                const worst = [...matchups].sort((a, b) => a.wr - b.wr || b.total - a.total).slice(0, 3);

                if (matchups.length === 0) return null;

                const MatchupCard = ({ mu, type }: { mu: typeof matchups[number]; type: 'best' | 'worst' }) => {
                    const accentColor = type === 'best' ? SMASH_COLORS.p4Green : SMASH_COLORS.p1Red;
                    return (
                        <Paper
                            elevation={2}
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                borderLeft: `4px solid ${accentColor}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            <Avatar
                                src={mu.imageUrl}
                                alt={mu.name}
                                sx={{ width: 52, height: 52, border: `2px solid ${accentColor}` }}
                            />
                            <Box flex={1} minWidth={0}>
                                <Typography fontWeight="bold" noWrap>{mu.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {mu.wins}W - {mu.losses}L ({mu.total} rounds)
                                </Typography>
                            </Box>
                            <Box textAlign="right">
                                <Typography variant="h5" fontWeight="bold" sx={{ color: accentColor }}>
                                    {mu.wr}%
                                </Typography>
                                <Typography variant="caption" color="text.secondary">win rate</Typography>
                            </Box>
                        </Paper>
                    );
                };

                return (
                    <Box mb={3}>
                        <Typography variant="h5" mb={2} fontWeight="bold">Character Matchups</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                            <Box>
                                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                                    <ThumbUp sx={{ color: SMASH_COLORS.p4Green }} />
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: SMASH_COLORS.p4Green }}>
                                        Best Against
                                    </Typography>
                                </Box>
                                <Box display="flex" flexDirection="column" gap={1.5}>
                                    {best.map(mu => <MatchupCard key={mu.charId} mu={mu} type="best" />)}
                                </Box>
                            </Box>
                            <Box>
                                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                                    <ThumbDown sx={{ color: SMASH_COLORS.p1Red }} />
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: SMASH_COLORS.p1Red }}>
                                        Worst Against
                                    </Typography>
                                </Box>
                                <Box display="flex" flexDirection="column" gap={1.5}>
                                    {worst.map(mu => <MatchupCard key={mu.charId} mu={mu} type="worst" />)}
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                );
            })()}

            <Typography variant="h4" mb={2}>Match History</Typography>
            {userMatches
                .filter(match => match.completed)
                .map(match => (
                    <Box
                        key={match.leagueId + match.matchNumber + match.split}
                        component={Card}
                        elevation={3}
                        p={2}
                        mb={1}
                        onClick={() => navigate(`/leagues/${match.leagueId}/split/${match.split}/match/${match.matchNumber}`)}
                        sx={{
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease',
                            '&:hover': { transform: 'translateY(-2px)' },
                        }}
                    >
                        <Box>
                            <Box display={'flex'} justifyContent='space-between' alignItems='center'>
                                <Typography
                                    variant="h4" fontFamily="monospace" fontStyle="italic"
                                    sx={{
                                        fontSize: { xs: '1.25rem', sm: '2.125rem' },
                                        color: match.winnerUserId === match.playerOne.userId ? SMASH_COLORS.p1Red : 'text.primary',
                                    }}
                                >
                                    {match.playerOne.displayName}
                                </Typography>
                                <Typography
                                    variant="h4" fontFamily="monospace" fontStyle="italic"
                                    sx={{
                                        fontSize: { xs: '1.25rem', sm: '2.125rem' },
                                        color: match.winnerUserId === match.playerTwo.userId ? SMASH_COLORS.p2Blue : 'text.primary',
                                    }}
                                >
                                    {match.playerTwo.displayName}
                                </Typography>
                            </Box>
                            <Box display='flex' flexDirection='row' justifyContent='space-between'>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'auto auto', justifyItems: 'center', }}>
                                    {match.rounds.map((round, i) => {
                                        const isWin = round.winnerUserId === match.playerOne.userId;
                                        return (
                                        <Box
                                            key={round.leagueId + round.split + round.matchNumber + round.roundNumber}
                                            sx={{
                                                border: '3px solid',
                                                borderRadius: 1,
                                                borderColor: isWin ? SMASH_COLORS.p4Green : SMASH_COLORS.p1Red,
                                                m: 0.5,
                                                gridColumn: i == 2 ? 'span 2' : 'span 1',
                                                display: 'flex',
                                                alignItems: 'center',
                                                position: 'relative',
                                                boxShadow: isWin ? `0 0 6px ${SMASH_COLORS.p4Green}66` : 'none',
                                            }}
                                        >
                                            <img
                                                alt={characters.find(c => c.id === round.playerOneCharacterId)?.fullName || 'Character'}
                                                style={{ width: 'clamp(40px, 10vw, 56px)', height: 'clamp(40px, 10vw, 56px)' }}
                                                src={
                                                    characters.find(c => c.id === round.playerOneCharacterId)?.imageUrl
                                                }
                                            />
                                            <Box sx={{ position: 'absolute', bottom: -2, right: -2 }}>
                                                {isWin
                                                    ? <CheckCircle sx={{ color: SMASH_COLORS.p4Green, fontSize: 18 }} />
                                                    : <Cancel sx={{ color: SMASH_COLORS.p1Red, fontSize: 18 }} />
                                                }
                                            </Box>
                                        </Box>
                                    );
                                    })}
                                </Box>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'auto auto', justifyItems: 'center' }}>
                                    {match.rounds.map((round, i) => {
                                        const isWin = round.winnerUserId === match.playerTwo.userId;
                                        return (
                                        <Box
                                            key={round.leagueId + round.split + round.matchNumber + round.roundNumber}
                                            sx={{
                                                border: '3px solid',
                                                borderRadius: 1,
                                                borderColor: isWin ? SMASH_COLORS.p4Green : SMASH_COLORS.p1Red,
                                                m: 0.5,
                                                gridColumn: i == 2 ? 'span 2' : 'span 1',
                                                display: 'flex',
                                                alignItems: 'center',
                                                position: 'relative',
                                                boxShadow: isWin ? `0 0 6px ${SMASH_COLORS.p4Green}66` : 'none',
                                            }}
                                        >
                                            <img
                                                alt={characters.find(c => c.id === round.playerTwoCharacterId)?.fullName || 'Character'}
                                                style={{ width: 'clamp(40px, 10vw, 56px)', height: 'clamp(40px, 10vw, 56px)' }}
                                                src={
                                                    characters.find(c => c.id === round.playerTwoCharacterId)?.imageUrl
                                                }
                                            />
                                            <Box sx={{ position: 'absolute', bottom: -2, right: -2 }}>
                                                {isWin
                                                    ? <CheckCircle sx={{ color: SMASH_COLORS.p4Green, fontSize: 18 }} />
                                                    : <Cancel sx={{ color: SMASH_COLORS.p1Red, fontSize: 18 }} />
                                                }
                                            </Box>
                                        </Box>
                                    );
                                    })}
                                </Box>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography> Match #{match.matchNumber} </Typography>
                                <Typography> Split {match.split} </Typography>
                            </Box>
                            <Box display='flex' flexDirection='column' justifyContent='flex-end'>
                                <Button variant="contained">
                                    {match.completed ? 'Change' : 'Register'}
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                ))}
        </Box>
    )
}
