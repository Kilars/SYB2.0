import { Box, Button, Card, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router";
import { useUserMatches } from "../../lib/hooks/useUserMatches";
import { useCharacters } from "../../lib/hooks/useCharacters";

export default function UserStats() {
    const { userId } = useParams();
    const { characters, charactersIsLoading } = useCharacters();
    const navigate = useNavigate();
    const { userMatches, isUserMatchesLoading } = useUserMatches(userId || '');

    if (isUserMatchesLoading || charactersIsLoading) return <Typography>Loading...</Typography>
    if (!userId || !userMatches || userMatches.length == 0 || !characters) return <Typography>No matches found</Typography>

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
            <Box sx={{ display: 'flex', justifyContent: 'space-evenly' }}>
                {Object.entries(charStats)
                    .filter(entry => entry[1].total > 2)
                    .sort((entryA, entryB) => entryB[1].total - entryA[1].total)
                    .sort((entryA, entryB) => entryB[1].wr - entryA[1].wr)
                    .slice(0, 3)
                    .map((entry) =>
                        <Box key={entry[0]}>
                            <Box> <Typography fontWeight="bold" variant="h5">{entry[0]}</Typography> </Box>
                            <Box> <Typography variant="h5">Wins: {entry[1].wins}</Typography> </Box>
                            <Box> <Typography variant="h5">Total: {entry[1].total}</Typography> </Box>
                            <Box> <Typography variant="h5">Wr: {entry[1].wr}%</Typography> </Box>
                        </Box>
                    )}
            </Box>
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
                                <Typography variant="h4" fontFamily="monospace" fontStyle="italic">{match.playerOne.displayName}</Typography>
                                <Typography variant="h4" fontFamily="monospace" fontStyle="italic">{match.playerTwo.displayName}</Typography>
                            </Box>
                            <Box display='flex' flexDirection='row' justifyContent='space-between'>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'auto auto', justifyItems: 'center', }}>
                                    {match.rounds.map((round, i) => (
                                        <Box
                                            key={round.leagueId + round.split + round.matchNumber + round.roundNumber}
                                            sx={{
                                                border: '2px solid',
                                                borderColor: round.winnerUserId === match.playerOne.userId ? 'green' : 'red',
                                                m: 1,
                                                gridColumn: i == 2 ? 'span 2' : 'span 1'
                                            }}
                                        >
                                            <img width='50' height='50' src={
                                                characters.find(c => c.id === round.playerOneCharacterId)?.imageUrl
                                            }
                                            />
                                        </Box>
                                    ))}
                                </Box>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'auto auto', justifyItems: 'center' }}>
                                    {match.rounds.map((round, i) => (
                                        <Box
                                            key={round.leagueId + round.split + round.matchNumber + round.roundNumber}
                                            sx={{
                                                border: '2px solid',
                                                borderColor: round.winnerUserId === match.playerTwo.userId ? 'green' : 'red',
                                                m: 1,
                                                gridColumn: i == 2 ? 'span 2' : 'span 1'
                                            }}
                                        >
                                            <img width='50' height='50' src={
                                                characters.find(c => c.id === round.playerTwoCharacterId)?.imageUrl
                                            }
                                            />
                                        </Box>
                                    ))}
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