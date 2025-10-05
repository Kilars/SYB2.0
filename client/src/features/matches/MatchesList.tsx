import { Box, Button, Card, CardHeader, Chip, Typography } from "@mui/material";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { useNavigate, useParams } from "react-router";

export default function MatchesList() {
  const { id } = useParams();
  const { league, isLeagueLoading } = useLeagues(id);
  const navigate = useNavigate();
  if (isLeagueLoading) return <Typography>Loading...</Typography>
  if (!league) return <Typography>No leagues found</Typography>
  return (
    <Box>
      {league.matches.length === 0
        ? <Typography>No matches...</Typography>
        :
        <Box display='flex' flexDirection='column' gap={2}>
          {league.matches.map(match => (
            <Box component={Card} elevation={3} p={2} onClick={() => navigate(`/matches/${match.id}`)}>
              <CardHeader action={<Chip label={match.completed ? 'Played' : 'Upcoming'} color={match.completed ? 'success' : 'warning'}></Chip>} />
              <Box display='flex' flexDirection='row' justifyContent='center' alignItems='center' gap={2}>
                <Typography variant="h3" fontFamily="monospace" fontStyle="italic">{match.playerOne.displayName}</Typography>
                <Typography variant="h4" fontStyle="italic">vs</Typography>
                <Typography variant="h3" fontFamily="monospace" fontStyle="italic">{match.playerTwo.displayName}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography> Match #{match.matchIndex} </Typography>
                  <Typography> Split {match.split} </Typography>
                  <Typography fontWeight="bold">
                    Bo{match.rounds.length}
                  </Typography>
                </Box>
                <Box display='flex' flexDirection='column' justifyContent='flex-end'>
                  <Button variant="contained" onClick={() => navigate(`/matches/${match.id}`)}>
                    {match.completed ? 'View' : 'Register'}
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
