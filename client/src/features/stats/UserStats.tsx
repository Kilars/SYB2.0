import { Box, Button, Card, Divider, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router";
import { useUserMatches } from "../../lib/hooks/useUserMatches";
import { useCharacters } from "../../lib/hooks/useCharacters";

export default function UserStats() {
    const { id } = useParams();
    const { characters, charactersIsLoading } = useCharacters();
    const navigate = useNavigate();
    const { userMatches, isUserMatchesLoading } = useUserMatches(id || '');

    if (isUserMatchesLoading || charactersIsLoading) return <Typography>Loading...</Typography>
    if (!id || !userMatches || userMatches.length == 0 || !characters) return <Typography>No matches found</Typography>
    return (
        <Box>
            <Typography variant="h4" mb={2}>Match History</Typography>
            {userMatches
                .filter(match => match.completed)
                .map(match => (
                <Box key={match.id} component={Card} elevation={3} p={2} mb={1} onClick={() => navigate(`./leagues/${match.id.split('_')[0]}/matches/${match.id}`)}>
                    <Box>
                        <Box display={'flex'} justifyContent='space-between' alignItems='center'>
                            <Typography variant="h4" fontFamily="monospace" fontStyle="italic">{match.playerOne.displayName}</Typography>
                            <Typography variant="h4" fontFamily="monospace" fontStyle="italic">{match.playerTwo.displayName}</Typography>
                        </Box>
                        <Box display='flex' flexDirection='row' justifyContent='space-between'>
                            <Box sx={{display: 'grid', gridTemplateColumns: 'auto auto', justifyItems: 'center',}}>
                                {match.rounds.map((round, i) => (
                                    <Box
                                        key={round.id}
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
                            <Box sx={{display: 'grid', gridTemplateColumns: 'auto auto', justifyItems: 'center'}}>
                                {match.rounds.map((round, i) => (
                                    <Box
                                        key={round.id}
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
                            <Typography> Match #{match.matchIndex} </Typography>
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