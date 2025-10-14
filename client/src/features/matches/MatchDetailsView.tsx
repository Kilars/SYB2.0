import { Box, Button, Checkbox, Typography } from "@mui/material";
import { useParams } from "react-router";
import { useMatch } from "../../lib/hooks/useMatch";
import { useCharacters } from "../../lib/hooks/useCharacters";

export default function MatchDetailsView() {
  const { leagueId, matchId } = useParams();
  const { match, isMatchLoading, reopenMatch } = useMatch(matchId || '');
  const { characters } = useCharacters();

  if (isMatchLoading) return <Typography>Loading...</Typography>
  if (!match || !characters) return <Typography>Match not found...</Typography>
  return (
    <Box>
      {match.rounds.filter(r => !!r.winnerUserId).map((round) => (
        <Box key={round.id}>
          <Typography variant="h5" mt={2}> Round {round.roundNumber} </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', flexGrow: 0.5 }}>
            <Box>
              <Box>
                <Typography variant="h6">{match.playerOne.displayName}</Typography>
              </Box>
              <Box>
                {round?.playerOneCharacter?.fullName}
              </Box>
              <Box sx={{display: 'flex'}}>
              <img width="50" height="50" src={
                characters.find(c => c.id === round.playerOneCharacterId)?.imageUrl
              } />
                <Checkbox disabled color="success" checked={round.winnerUserId === match.playerOne.userId} />
              </Box>
            </Box>
            <Box>
              <Box>
                <Typography variant="h6">{match.playerTwo.displayName}</Typography>
              </Box>
              <Box>
                {round?.playerTwoCharacter?.fullName}
              </Box>
              <Box sx={{display: 'flex'}}>
                <Checkbox disabled color="success" checked={round.winnerUserId === match.playerTwo.userId}></Checkbox>
              <img width="50" height="50" src={
                characters.find(c => c.id === round.playerTwoCharacterId)?.imageUrl
              } />
              </Box>
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
