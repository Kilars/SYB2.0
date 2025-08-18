import { Box, Button, Checkbox, Typography } from "@mui/material";
import { useParams } from "react-router";
import { useMatch } from "../../lib/hooks/useMatch";

export default function MatchDetailsView() {
  const { id } = useParams();
  const { match, isMatchLoading, reopenMatch } = useMatch(id || '');

  if (isMatchLoading) return <Typography>Loading...</Typography>
  if (!match) return <Typography>Match not found...</Typography>
  return (
    <Box>
      {match.rounds.filter(r => !!r.winnerUserId).map((round) => (
        <Box key={round.id}>
          <Typography variant="h5" mt={2}> Round {round.roundNumber} </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 0.5 }}>
            <Box>
              <Box>
                <Typography variant="h6">{match.playerOne.displayName}</Typography>
              </Box>
              <Box>
                {round?.playerOneCharacter?.fullName}
              </Box>
              <Checkbox disabled color="success" checked={round.winnerUserId === match.playerOne.userId} />
                <img src={round.playerTwoCharacter?.imageUrl} alt={round.playerTwoCharacter?.fullName} />
            </Box>
            <Box>
              <Box>
                <Typography variant="h6">{match.playerTwo.displayName}</Typography>
              </Box>
              <Box>
                {round?.playerTwoCharacter?.fullName}
              </Box>
              <Checkbox disabled color="success" checked={round.winnerUserId === match.playerTwo.userId}></Checkbox>
            </Box>
          </Box>
        </Box>
      ))}
      <Button
        variant="contained"
        fullWidth
        sx={{ mt: 3 }}
        onClick={async () => await reopenMatch.mutateAsync()}
      >
        Reopen match
      </Button>
    </Box>
  )
}
