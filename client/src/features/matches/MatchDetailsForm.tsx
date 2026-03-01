import { useParams } from "react-router";
import { useMatch } from "../../lib/hooks/useMatch";
import { Box, Button, Card, CardContent, Paper, ToggleButton, ToggleButtonGroup, Typography, CircularProgress } from "@mui/material";
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
import { SMASH_COLORS } from "../../app/theme";

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

  const ROUND_STATUS_COLORS = {
    complete: SMASH_COLORS.p4Green,
    partial: SMASH_COLORS.p3Yellow,
    empty: 'transparent',
  };

  return (
    <Box>
      <Typography variant="h4" mb={2} fontWeight="bold">Register Match Result</Typography>

      {/* Match score indicator */}
      <Paper
        elevation={2}
        sx={{
          p: 2, mb: 3, textAlign: 'center',
          background: `linear-gradient(135deg, ${SMASH_COLORS.p1Red}15 0%, transparent 40%, ${SMASH_COLORS.p2Blue}15 100%)`,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ color: playerOneScore > playerTwoScore ? SMASH_COLORS.p1Red : 'text.primary' }}
          >
            {getDisplayName(matchData.playerOne)}
          </Typography>
          <Box sx={{
            px: 2, py: 0.5,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${SMASH_COLORS.p1Red}, ${SMASH_COLORS.p2Blue})`,
          }}>
            <Typography variant="h5" fontWeight="bold" color="white">
              {playerOneScore} — {playerTwoScore}
            </Typography>
          </Box>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ color: playerTwoScore > playerOneScore ? SMASH_COLORS.p2Blue : 'text.primary' }}
          >
            {getDisplayName(matchData.playerTwo)}
          </Typography>
        </Box>
      </Paper>

      {/* Round progress dots */}
      <Box display="flex" justifyContent="center" gap={1} mb={3}>
        {rounds.map((round, i) => {
          const status = getRoundStatus(round);
          return (
            <Box
              key={i}
              sx={{
                width: 12, height: 12, borderRadius: '50%',
                backgroundColor: ROUND_STATUS_COLORS[status],
                border: `2px solid ${status === 'empty' ? '#ccc' : ROUND_STATUS_COLORS[status]}`,
                transition: 'all 0.2s ease',
              }}
            />
          );
        })}
      </Box>

      {rounds.map((round, i) => {
        const roundStatus = getRoundStatus(round);
        const isRoundThreeDecided = i === 2 && matchDecided;
        const borderColor = ROUND_STATUS_COLORS[roundStatus];

        return (
          <Card
            key={round.leagueId + round.split + round.matchNumber + round.roundNumber}
            variant="outlined"
            sx={{
              opacity: isRoundThreeDecided ? 0.5 : 1,
              mb: 2,
              borderLeft: `4px solid ${borderColor}`,
              transition: 'border-color 0.3s ease',
            }}
          >
            <CardContent>
              {/* Round header with inline validation icon */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h5" fontWeight="bold">Round {round.roundNumber}</Typography>
                {roundStatus === 'complete' && (
                  <CheckCircleOutlineIcon sx={{ color: SMASH_COLORS.p4Green }} />
                )}
                {roundStatus === 'partial' && (
                  <WarningAmberIcon sx={{ color: SMASH_COLORS.p3Yellow }} />
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
                  <Typography variant="h6" sx={{ color: SMASH_COLORS.p1Red }}>{getDisplayName(matchData.playerOne)}</Typography>
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
                  <Typography variant="h6" sx={{ color: SMASH_COLORS.p2Blue }}>{getDisplayName(matchData.playerTwo)}</Typography>
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
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary', fontWeight: 600 }}>Winner</Typography>
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
                  sx={{
                    '& .Mui-selected': {
                      fontWeight: 'bold',
                    },
                  }}
                >
                  <ToggleButton
                    value={matchData.playerOne.userId}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: `${SMASH_COLORS.p1Red}22`,
                        borderColor: SMASH_COLORS.p1Red,
                        color: SMASH_COLORS.p1Red,
                      },
                    }}
                  >
                    {getDisplayName(matchData.playerOne)}
                  </ToggleButton>
                  <ToggleButton
                    value={matchData.playerTwo.userId}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: `${SMASH_COLORS.p2Blue}22`,
                        borderColor: SMASH_COLORS.p2Blue,
                        color: SMASH_COLORS.p2Blue,
                      },
                    }}
                  >
                    {getDisplayName(matchData.playerTwo)}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </CardContent>
          </Card>
        );
      })}

      <Button
        variant="contained"
        fullWidth
        sx={{
          mt: 3,
          py: 1.5,
          fontWeight: 'bold',
          fontSize: '1rem',
          background: `linear-gradient(135deg, ${SMASH_COLORS.p4Green}, ${SMASH_COLORS.p2Blue})`,
          '&:hover': { background: `linear-gradient(135deg, ${SMASH_COLORS.p4Green}cc, ${SMASH_COLORS.p2Blue}cc)` },
        }}
        disabled={isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
        onClick={() => onSubmit()}
      >
        {isSubmitting ? 'Completing...' : 'Complete'}
      </Button>
    </Box>
  )
}
