import { useParams } from "react-router";
import { useMatch } from "../../lib/hooks/useMatch";
import { Box, Button, ToggleButton, ToggleButtonGroup, Typography, CircularProgress } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { SportsEsports } from "@mui/icons-material";
import CharacterSelect from "./CharacterSelect";
import { matchSchema } from "../../lib/schemas/matchSchema";
import { useEffect, useState } from "react";
import z from "zod";
import { toast } from "react-toastify";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import EmptyState from "../../app/shared/components/EmptyState";

export default function MatchDetailsForm() {
  const { leagueId, split, match } = useParams();
  const { match: matchData, isMatchLoading, completeMatch } = useMatch(leagueId || '', parseInt(split || ''), parseInt(match || ''));
  const [rounds, setRounds] = useState(matchData?.rounds)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setRounds(matchData?.rounds)
  }, [matchData])

  const onSubmit = async () => {
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isMatchLoading) return <LoadingSkeleton variant="detail" />
  if (!match || !matchData) return (
    <EmptyState
      icon={<SportsEsports sx={{ fontSize: 48 }} />}
      message="Match not found"
    />
  )
  if (!rounds) return (
    <EmptyState
      icon={<SportsEsports sx={{ fontSize: 48 }} />}
      message="Match not found"
    />
  )

  const getDisplayName = (player: Player) => player.isGuest ? `${player.displayName} (guest)` : player.displayName;

  // Compute running score from completed rounds
  const playerOneScore = rounds.filter(r => r.winnerUserId === matchData.playerOne.userId).length;
  const playerTwoScore = rounds.filter(r => r.winnerUserId === matchData.playerTwo.userId).length;
  const matchDecided = playerOneScore === 2 || playerTwoScore === 2;

  // Determine per-round status: 'complete' | 'partial' | 'empty'
  function getRoundStatus(round: Round): 'complete' | 'partial' | 'empty' {
    const filledFields = [
      round.playerOneCharacterId,
      round.playerTwoCharacterId,
      round.winnerUserId,
    ].filter(Boolean).length;
    if (filledFields === 3) return 'complete';
    if (filledFields > 0) return 'partial';
    return 'empty';
  }

  return (
    <Box>
      <Typography variant="h4" mb={2}>Register Match Result</Typography>

      {/* Match score indicator */}
      <Typography variant="h5" mb={3} sx={{ fontWeight: 'bold', textAlign: 'center' }}>
        {getDisplayName(matchData.playerOne)} {playerOneScore} — {playerTwoScore} {getDisplayName(matchData.playerTwo)}
      </Typography>

      {rounds.map((round, i) => {
        const roundStatus = getRoundStatus(round);
        const isRoundThreeDecided = i === 2 && matchDecided;

        return (
          <Box
            key={round.leagueId + round.split + round.matchNumber + round.roundNumber}
            sx={{ opacity: isRoundThreeDecided ? 0.5 : 1, mb: 3 }}
          >
            {/* Round header with inline validation icon */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, mb: 1 }}>
              <Typography variant="h5">Round {round.roundNumber}</Typography>
              {roundStatus === 'complete' && (
                <CheckCircleOutlineIcon sx={{ color: 'success.main' }} />
              )}
              {roundStatus === 'partial' && (
                <WarningAmberIcon sx={{ color: 'warning.main' }} />
              )}
              {isRoundThreeDecided && (
                <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>
                  Match already decided
                </Typography>
              )}
            </Box>

            {/* Player columns — responsive: stacked on mobile, side-by-side on sm+ */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">{getDisplayName(matchData.playerOne)}</Typography>
                <CharacterSelect
                  onChange={id =>
                    setRounds(originalRounds =>
                      originalRounds?.map((r, index) =>
                        index === i ? { ...r, playerOneCharacterId: id } : r
                      )
                    )
                  }
                  selectedId={round.playerOneCharacterId}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">{getDisplayName(matchData.playerTwo)}</Typography>
                <CharacterSelect
                  onChange={id =>
                    setRounds(originalRounds =>
                      originalRounds?.map((r, index) =>
                        index === i ? { ...r, playerTwoCharacterId: id } : r
                      )
                    )
                  }
                  selectedId={round.playerTwoCharacterId}
                />
              </Box>
            </Box>

            {/* Single winner toggle spanning full width */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>Winner</Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                value={round.winnerUserId ?? null}
                onChange={(_, newValue) => {
                  setRounds(prev =>
                    prev?.map((r, idx) =>
                      idx === i ? { ...r, winnerUserId: newValue ?? undefined } : r
                    )
                  );
                }}
              >
                <ToggleButton value={matchData.playerOne.userId}>
                  {getDisplayName(matchData.playerOne)}
                </ToggleButton>
                <ToggleButton value={matchData.playerTwo.userId}>
                  {getDisplayName(matchData.playerTwo)}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        );
      })}

      <Button
        variant="contained"
        fullWidth
        sx={{ mt: 3 }}
        disabled={isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
        onClick={() => onSubmit()}
      >
        {isSubmitting ? 'Completing...' : 'Complete'}
      </Button>
    </Box>
  )
}
