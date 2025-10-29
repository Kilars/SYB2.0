import { useParams } from "react-router";
import { useMatch } from "../../lib/hooks/useMatch";
import { Box, Button, Checkbox, Typography } from "@mui/material";
import CharacterSelect from "./CharacterSelect";
import { matchSchema } from "../../lib/schemas/matchSchema";
import { useEffect, useState } from "react";
import z from "zod";
import { toast } from "react-toastify";

export default function MatchDetailsForm() {
  const { leagueId, split, match } = useParams();
  const { match: matchData, isMatchLoading, completeMatch } = useMatch(leagueId || '', parseInt(split || ''), parseInt(match || ''));
  const [rounds, setRounds] = useState(matchData?.rounds)

  useEffect(() => {
    setRounds(matchData?.rounds)
  }, [matchData])

  const onSubmit = async () => {
    try {
      matchSchema.parse(rounds)
      if (rounds) await completeMatch.mutateAsync(rounds);
      toast('Succes', {type: 'success'})
    } catch (error) {
      if (error instanceof z.ZodError) {
        for (const issue of error.issues) {
          toast(issue.message, {type: 'error'});
        }
      } else (
        toast('Server error', {type: 'error'})
      )
    }
  }

  if (isMatchLoading) return <Typography>Loading...</Typography>
  if (!match || !matchData) return <Typography>Match not found...</Typography>
  if (!rounds) return <Typography>Rounds not found...</Typography>

  return (
    <Box>
      <Typography variant="h4" mb={3}>Register Match Result</Typography>
      {rounds.map((round, i) => (
        <Box key={round.leagueId + round.split + round.matchNumber + round.roundNumber}>
          <Typography variant="h5" mt={2}> Round {round.roundNumber} </Typography>
          <Box>
            <Box sx={{ display: 'flex' }}>
              <Box sx={{ width: '50%' }}>
                <Typography variant="h6">{matchData.playerOne.displayName}</Typography>
                <CharacterSelect onChange={id =>
                  setRounds(originalRounds => {
                    return originalRounds?.map((round, index) => {
                      if (index === i) {
                        return {
                          ...round,
                          playerOneCharacterId: id
                        };
                      }
                      return round;
                    });
                  })
                } selectedId={round.playerOneCharacterId} />
                <Box>Winner:
                  <Checkbox
                    checked={round.winnerUserId === matchData.playerOne.userId}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      const isChecking = event.target.checked;
                      setRounds(originalRounds => {
                        return originalRounds?.map((round, index) => {
                          if (index === i) {
                            return {
                              ...round,
                              winnerUserId: isChecking ? matchData.playerOne.userId : undefined,
                            };
                          }
                          return round;
                        });
                      })
                    }}
                  />
                </Box>
              </Box>
              <Box sx={{ width: '50%'}}>
                <Typography variant="h6">{matchData.playerTwo.displayName}</Typography>
                <CharacterSelect onChange={id =>
                  setRounds(originalRounds => {
                    return originalRounds?.map((round, index) => {
                      if (index === i) {
                        return {
                          ...round,
                          playerTwoCharacterId: id
                        };
                      }
                      return round;
                    });
                  })
                } selectedId={round.playerTwoCharacterId} />
                <Box>Winner:
                  <Checkbox
                    checked={round.winnerUserId === matchData.playerTwo.userId}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      const isChecking = event.target.checked;
                      setRounds(originalRounds => {
                        return originalRounds?.map((round, index) => {
                          if (index === i) {
                            return {
                              ...round,
                              winnerUserId: isChecking ? matchData.playerTwo.userId : undefined,
                            };
                          }
                          return round;
                        });
                      })
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      ))}
      <Button
        variant="contained"
        fullWidth
        sx={{ mt: 3 }}
        onClick={() => onSubmit()}
      >
        Complete
      </Button>
    </Box>
  )
}
