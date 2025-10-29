import { Box, Button, Card, Typography } from "@mui/material";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { useNavigate, useParams } from "react-router";
import { useCharacters } from "../../lib/hooks/useCharacters";

export default function MatchesList() {
  const { leagueId } = useParams();
  const { league, isLeagueLoading } = useLeagues(leagueId);
  const { characters } = useCharacters();
  const navigate = useNavigate();
  if (isLeagueLoading) return <Typography>Loading...</Typography>
  if (!league || !characters) return <Typography>No leagues found</Typography>
  return (
    <Box>
      {league.matches.length === 0
        ? <Typography>No matches...</Typography>
        :
        <Box display='flex' flexDirection='column' gap={2}>
          {league.matches.map(match => (
              <Box
                key={match.leagueId + match.split + match.matchNumber}
                component={Card}
                elevation={3}
                p={2}
                onClick={() => navigate(`/leagues/${match.leagueId}/split/${match.split}/match/${match.matchNumber}`)}
              >
              <Box>
                <Box display={'flex'} justifyContent='space-between' alignItems='center'>
                  <Typography variant="h4" fontFamily="monospace" fontStyle="italic">{match.playerOne.displayName}</Typography>
                  <Typography variant="h4" fontFamily="monospace" fontStyle="italic">{match.playerTwo.displayName}</Typography>
                </Box>
                <Box display= 'flex' flexDirection='row' justifyContent='space-between'>
                  <Box display='flex'>
                    {match.rounds.map(round => (
                      <Box key={round.leagueId + round.split + round.matchNumber + round.roundNumber} sx={{border: '2px solid', m: 1, borderColor: round.winnerUserId === match.playerOne.userId ? 'green' : 'red'}}>
                        <img width='50' height='50' src={
                          characters.find(c => c.id === round.playerOneCharacterId)?.imageUrl
                        }
                        />
                      </Box>
                    ))}
                  </Box>
                  <Box display='flex'>
                    {match.rounds.map(round => (
                      <Box key={round.leagueId + round.split + round.matchNumber + round.roundNumber} sx={{border: '2px solid', m: 1, borderColor: round.winnerUserId === match.playerTwo.userId ? 'green' : 'red'}}>
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
      }
    </Box>
  )
}
