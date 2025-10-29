import { Box, Button, Typography } from "@mui/material";
import { useParams } from "react-router";
import { useMatch } from "../../lib/hooks/useMatch";
import { useCharacters } from "../../lib/hooks/useCharacters";
import { Check } from "@mui/icons-material";

export default function MatchDetailsView() {
  const { leagueId, split, match } = useParams();
  const { match: matchData, isMatchLoading, reopenMatch } = useMatch(leagueId || '', parseInt(split || ''), parseInt(match || ''));
  const { characters } = useCharacters();

  if (isMatchLoading) return <Typography>Loading...</Typography>
  if (!matchData || !characters) return <Typography>Match not found...</Typography>
  return (
    <Box>
      {matchData.rounds.filter(r => !!r.winnerUserId).map((round) => (
        <Box key={round.leagueId + round.split + round.matchNumber + round.roundNumber}>
          <Typography variant="h5" mt={2}> Round {round.roundNumber} </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', flexGrow: 0.5 }}>
            <Box>
              <Box>
                <Typography variant="h6">{matchData.playerOne.displayName}</Typography>
              </Box>
              <Box>
                {round?.playerOneCharacter?.fullName}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img width="50" height="50" src={
                  characters.find(c => c.id === round.playerOneCharacterId)?.imageUrl
                } />
                {round.winnerUserId === matchData.playerOne.userId &&
                  <Check fontSize="large" color="success" />
                }
              </Box>
            </Box>
            <Box>
              <Box>
                <Typography variant="h6">{matchData.playerTwo.displayName}</Typography>
              </Box>
              <Box>
                {round?.playerTwoCharacter?.fullName}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {round.winnerUserId === matchData.playerTwo.userId &&
                  <Check fontSize="large" color="success" />
                }
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
