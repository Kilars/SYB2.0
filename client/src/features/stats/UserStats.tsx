import { Avatar, Box, Button, Card, CardContent, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router";
import { useUserMatches } from "../../lib/hooks/useUserMatches";
import { useCharacters } from "../../lib/hooks/useCharacters";
import { BarChart, CheckCircle, Cancel } from "@mui/icons-material";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import EmptyState from "../../app/shared/components/EmptyState";

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
                        {topChars.map(([charId, stats]) => {
                            const character = characters.find(c => c.id === charId);
                            return (
                                <Card key={charId}>
                                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar src={character?.imageUrl} alt={character?.fullName ?? 'Unknown'} sx={{ width: 56, height: 56 }} />
                                        <Box>
                                            <Typography fontWeight="bold">{character?.fullName ?? 'Unknown'}</Typography>
                                            <Typography variant="body2">Wins: {stats.wins} / Total: {stats.total}</Typography>
                                            <Typography variant="body2">Win rate: {stats.wr}%</Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            );
                        })}
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
                    >
                        <Box>
                            <Box display={'flex'} justifyContent='space-between' alignItems='center'>
                                <Typography variant="h4" fontFamily="monospace" fontStyle="italic" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>{match.playerOne.displayName}</Typography>
                                <Typography variant="h4" fontFamily="monospace" fontStyle="italic" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>{match.playerTwo.displayName}</Typography>
                            </Box>
                            <Box display='flex' flexDirection='row' justifyContent='space-between'>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'auto auto', justifyItems: 'center', }}>
                                    {match.rounds.map((round, i) => {
                                        const isWin = round.winnerUserId === match.playerOne.userId;
                                        return (
                                        <Box
                                            key={round.leagueId + round.split + round.matchNumber + round.roundNumber}
                                            sx={{
                                                border: '2px solid',
                                                borderColor: isWin ? 'success.main' : 'error.main',
                                                m: 1,
                                                gridColumn: i == 2 ? 'span 2' : 'span 1',
                                                display: 'flex',
                                                alignItems: 'center',
                                                position: 'relative'
                                            }}
                                        >
                                            <img
                                                alt={characters.find(c => c.id === round.playerOneCharacterId)?.fullName || 'Character'}
                                                style={{ width: 'clamp(35px, 8vw, 50px)', height: 'clamp(35px, 8vw, 50px)' }}
                                                src={
                                                    characters.find(c => c.id === round.playerOneCharacterId)?.imageUrl
                                                }
                                            />
                                            <Box sx={{ position: 'absolute', bottom: 0, right: 0 }}>
                                                {isWin ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
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
                                                border: '2px solid',
                                                borderColor: isWin ? 'success.main' : 'error.main',
                                                m: 1,
                                                gridColumn: i == 2 ? 'span 2' : 'span 1',
                                                display: 'flex',
                                                alignItems: 'center',
                                                position: 'relative'
                                            }}
                                        >
                                            <img
                                                alt={characters.find(c => c.id === round.playerTwoCharacterId)?.fullName || 'Character'}
                                                style={{ width: 'clamp(35px, 8vw, 50px)', height: 'clamp(35px, 8vw, 50px)' }}
                                                src={
                                                    characters.find(c => c.id === round.playerTwoCharacterId)?.imageUrl
                                                }
                                            />
                                            <Box sx={{ position: 'absolute', bottom: 0, right: 0 }}>
                                                {isWin ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
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