import { useParams } from "react-router";
import { useMatch } from "../../lib/hooks/useMatch";
import { Box, Button, Checkbox, Divider, Typography } from "@mui/material";
import CharacterSelect from "./CharacterSelect";

export default function MatchDetails() {
  const { id } = useParams();
  const { match, isMatchLoading } = useMatch(id || '');

  if (isMatchLoading) return <Typography>Loading...</Typography>
  if (!match) return <Typography>Match not found...</Typography>

  return (
    <Box>
      <Typography variant="h4" mb={3}>Register Match Result</Typography>
      {match.rounds.map((round, i) => (
        <Box key={round.id}>
          <Typography variant="h5" mt={2}> Round {round.roundNumber} </Typography>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-evenly' }}>
              <Box sx={{display: 'flex', flexDirection: 'column'}}>
                <Typography variant="h6" textAlign="right">{match.playerOne.displayName}</Typography>
                <CharacterSelect />
                <Box>Winner: <Checkbox /></Box>
              </Box>
              <Box>
                <Typography variant="h6">{match.playerTwo.displayName}</Typography>
                <CharacterSelect />
                <Box>Winner: <Checkbox /></Box>
              </Box>
            </Box>
          </Box>
          {i !== match.rounds.length && <Divider />}
        </Box>
      ))}
      <Button
        variant="contained"
        fullWidth
        sx={{ mt: 3 }}
      >
        Complete
      </Button>
    </Box>
  )
}
