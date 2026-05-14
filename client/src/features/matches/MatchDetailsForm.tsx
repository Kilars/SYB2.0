import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { type Control, useFieldArray, type UseFormWatch } from "react-hook-form";

import { useAppTheme } from "../../app/context/ThemeContext";
import { SMASH_COLORS } from "../../app/theme";
import { getPlayerDisplayName } from "../../lib/util/util";
import CharacterSelect from "./CharacterSelect";

type MatchFormValues = { rounds: Round[] };

interface MatchDetailsFormProps {
  matchData: Match;
  control: Control<MatchFormValues>;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  watch: UseFormWatch<MatchFormValues>;
  isSubmitting: boolean;
}

export default function MatchDetailsForm({
  matchData,
  control,
  handleSubmit,
  watch,
  isSubmitting,
}: MatchDetailsFormProps) {
  const { meta } = useAppTheme();

  const { fields, update } = useFieldArray({ control, name: "rounds" });
  const rounds = watch("rounds");

  const { playerOne, playerTwo } = matchData;
  if (!playerOne || !playerTwo) return null;

  const playerOneScore = rounds.filter((r) => r.winnerUserId === playerOne.userId).length;
  const playerTwoScore = rounds.filter((r) => r.winnerUserId === playerTwo.userId).length;
  const requiredWins = Math.ceil(rounds.length / 2);
  const matchDecided = playerOneScore >= requiredWins || playerTwoScore >= requiredWins;

  function getRoundStatus(round: Round): "complete" | "partial" | "empty" {
    const filledFields = [
      round.playerOneCharacterId,
      round.playerTwoCharacterId,
      round.winnerUserId,
    ].filter(Boolean).length;
    if (filledFields === 3) return "complete";
    if (filledFields > 0) return "partial";
    return "empty";
  }

  const ROUND_STATUS_COLORS = {
    complete: SMASH_COLORS.p4Green,
    partial: SMASH_COLORS.p3Yellow,
    empty: "transparent",
  };

  return (
    <Box>
      <Typography
        variant="h4"
        mb={2}
        fontWeight="bold"
        sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" } }}
      >
        Register Match Result
      </Typography>

      {/* Match score indicator */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 3,
          textAlign: "center",
          background: `linear-gradient(135deg, ${SMASH_COLORS.p1Red}15 0%, transparent 40%, ${SMASH_COLORS.p2Blue}15 100%)`,
          overflow: "hidden",
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={{ xs: 1, sm: 2 }}
          flexWrap="wrap"
        >
          <Typography
            variant="h5"
            fontWeight="bold"
            noWrap
            sx={{
              color: playerOneScore > playerTwoScore ? SMASH_COLORS.p1Red : "text.primary",
              fontSize: { xs: "1rem", sm: "1.5rem" },
              maxWidth: { xs: "30vw", sm: "none" },
            }}
          >
            {getPlayerDisplayName(playerOne)}
          </Typography>
          <Box
            sx={{
              px: 2,
              py: 0.5,
              borderRadius: 2,
              background: meta.accentGradient,
            }}
          >
            <Typography variant="h5" fontWeight="bold" color="white">
              {playerOneScore} — {playerTwoScore}
            </Typography>
          </Box>
          <Typography
            variant="h5"
            fontWeight="bold"
            noWrap
            sx={{
              color: playerTwoScore > playerOneScore ? SMASH_COLORS.p2Blue : "text.primary",
              fontSize: { xs: "1rem", sm: "1.5rem" },
              maxWidth: { xs: "30vw", sm: "none" },
            }}
          >
            {getPlayerDisplayName(playerTwo)}
          </Typography>
        </Box>
      </Paper>

      {/* Round progress indicators */}
      <Box display="flex" justifyContent="center" gap={2} mb={3}>
        {rounds.map((round, i) => {
          const status = getRoundStatus(round);
          return (
            <Box key={i} display="flex" flexDirection="column" alignItems="center" gap={0.5}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: ROUND_STATUS_COLORS[status],
                  border: `2px solid ${status === "empty" ? "#ccc" : ROUND_STATUS_COLORS[status]}`,
                  transition: "all 0.2s ease",
                }}
              />
              <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>
                R{round.roundNumber}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {fields.map((field, i) => {
        const round = rounds[i];
        const roundStatus = getRoundStatus(round);
        const isDecidedEarly = matchDecided && !round.winnerUserId;
        const borderColor = ROUND_STATUS_COLORS[roundStatus];

        // Compute which characters are locked out for each player in this round:
        // any character used in an earlier round (lower index) that already has a winner set.
        const playerOneDisabled = rounds
          .filter((r, idx) => idx < i && r.winnerUserId && r.playerOneCharacterId)
          .map((r) => r.playerOneCharacterId as string);
        const playerTwoDisabled = rounds
          .filter((r, idx) => idx < i && r.winnerUserId && r.playerTwoCharacterId)
          .map((r) => r.playerTwoCharacterId as string);

        return (
          <Card
            key={field.id}
            variant="outlined"
            sx={{
              opacity: isDecidedEarly ? 0.5 : 1,
              mb: 2,
              borderLeft: `4px solid ${borderColor}`,
              transition: "border-color 0.3s ease",
            }}
          >
            <CardContent>
              {/* Round header with inline validation icon */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Typography variant="h5" fontWeight="bold">
                  Round {round.roundNumber}
                </Typography>
                {roundStatus === "complete" && (
                  <CheckCircleOutlineIcon sx={{ color: SMASH_COLORS.p4Green }} />
                )}
                {roundStatus === "partial" && (
                  <WarningAmberIcon sx={{ color: SMASH_COLORS.p3Yellow }} />
                )}
                {isDecidedEarly && (
                  <Typography variant="body2" sx={{ color: "text.secondary", ml: 1 }}>
                    Match already decided
                  </Typography>
                )}
              </Box>

              {/* Player columns — responsive: stacked on mobile, side-by-side on sm+ */}
              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ color: SMASH_COLORS.p1Red }}>
                    {getPlayerDisplayName(playerOne)}
                  </Typography>
                  <CharacterSelect
                    onChange={(id) =>
                      update(i, { ...rounds[i], playerOneCharacterId: id })
                    }
                    selectedId={round.playerOneCharacterId}
                    userId={playerOne.userId}
                    disabledIds={playerOneDisabled}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ color: SMASH_COLORS.p2Blue }}>
                    {getPlayerDisplayName(playerTwo)}
                  </Typography>
                  <CharacterSelect
                    onChange={(id) =>
                      update(i, { ...rounds[i], playerTwoCharacterId: id })
                    }
                    selectedId={round.playerTwoCharacterId}
                    userId={playerTwo.userId}
                    disabledIds={playerTwoDisabled}
                  />
                </Box>
              </Box>

              {/* Single winner toggle spanning full width */}
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ mb: 0.5, color: "text.secondary", fontWeight: 600 }}
                >
                  Who won Round {round.roundNumber}?
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  value={round.winnerUserId ?? null}
                  onChange={(_, newValue) => {
                    update(i, { ...rounds[i], winnerUserId: newValue ?? undefined });
                  }}
                  aria-label={`Round ${round.roundNumber} winner selection`}
                  sx={{
                    "& .Mui-selected": {
                      fontWeight: "bold",
                    },
                  }}
                >
                  <ToggleButton
                    value={playerOne.userId}
                    aria-label={`${getPlayerDisplayName(playerOne)} wins round ${round.roundNumber}`}
                    sx={{
                      "&.Mui-selected": {
                        backgroundColor: `${SMASH_COLORS.p1Red}22`,
                        borderColor: SMASH_COLORS.p1Red,
                        color: SMASH_COLORS.p1Red,
                      },
                    }}
                  >
                    {getPlayerDisplayName(playerOne)}
                  </ToggleButton>
                  <ToggleButton
                    value={playerTwo.userId}
                    aria-label={`${getPlayerDisplayName(playerTwo)} wins round ${round.roundNumber}`}
                    sx={{
                      "&.Mui-selected": {
                        backgroundColor: `${SMASH_COLORS.p2Blue}22`,
                        borderColor: SMASH_COLORS.p2Blue,
                        color: SMASH_COLORS.p2Blue,
                      },
                    }}
                  >
                    {getPlayerDisplayName(playerTwo)}
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
          fontWeight: "bold",
          fontSize: "1rem",
          background: matchDecided ? meta.accentGradient : undefined,
          backgroundColor: matchDecided ? undefined : "action.disabledBackground",
          color: matchDecided ? "white" : "text.secondary",
          "&:hover": matchDecided ? { opacity: 0.85 } : {},
          transition: "all 0.3s ease",
        }}
        disabled={isSubmitting}
        startIcon={
          isSubmitting ? (
            <CircularProgress size={20} />
          ) : matchDecided ? (
            <CheckCircleOutlineIcon />
          ) : undefined
        }
        onClick={handleSubmit}
      >
        {isSubmitting ? "Completing..." : matchDecided ? "Complete Match" : "Fill in rounds to complete"}
      </Button>
    </Box>
  );
}
