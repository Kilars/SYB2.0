import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import PodiumPickerField, {
  type FfaPlacements,
} from "../../app/shared/components/PodiumPickerField";
import { useFfaMatch } from "../../lib/hooks/useFfaMatch";
import type { PodiumPlayer } from "../../lib/hooks/usePodiumState";
import { makeFfaResultSchema } from "../../lib/schemas/ffaPlacementsRefine";

interface FfaMatchFormProps {
  matchData: Match;
  mode?: "league" | "tournament";
}

type FfaFormValues = {
  placements: FfaPlacements;
};

const EMPTY_PLACEMENTS: FfaPlacements = {
  winnerUserId: null,
  secondPlaceUserId: null,
  thirdPlaceUserId: null,
  fourthPlaceUserId: null,
};

export default function FfaMatchForm({ matchData, mode = "league" }: FfaMatchFormProps) {
  const { competitionId, bracketNumber, matchNumber } = matchData;
  const { completeFfaMatch } = useFfaMatch(
    mode === "tournament"
      ? { mode: "tournament", competitionId, matchNumber }
      : { mode: "league", competitionId, bracketNumber, matchNumber },
  );

  // Collect participants from matchData (N>2 has playerThree/Four as well)
  const participants: PodiumPlayer[] = useMemo(() => {
    const result: PodiumPlayer[] = [];
    if (matchData.playerOne)
      result.push({
        userId: matchData.playerOne.userId,
        displayName: matchData.playerOne.displayName,
        isGuest: matchData.playerOne.isGuest,
      });
    if (matchData.playerTwo)
      result.push({
        userId: matchData.playerTwo.userId,
        displayName: matchData.playerTwo.displayName,
        isGuest: matchData.playerTwo.isGuest,
      });
    if (matchData.playerThree)
      result.push({
        userId: matchData.playerThree.userId,
        displayName: matchData.playerThree.displayName,
        isGuest: matchData.playerThree.isGuest,
      });
    if (matchData.playerFour)
      result.push({
        userId: matchData.playerFour.userId,
        displayName: matchData.playerFour.displayName,
        isGuest: matchData.playerFour.isGuest,
      });
    return result;
  }, [matchData.playerOne, matchData.playerTwo, matchData.playerThree, matchData.playerFour]);

  const playerCount = (matchData.playerCount ?? 2) as 2 | 3 | 4;

  // Tournaments with N=4 require full podium (top-2 for advancement).
  const requireFullPodium = mode === "tournament" && playerCount === 4;
  const schema = useMemo(
    () =>
      makeFfaResultSchema(() => participants.map((p) => p.userId), {
        allowWinnerOnly: !requireFullPodium,
        requireFullPodium,
      }),
    [participants, requireFullPodium],
  );

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FfaFormValues>({
    defaultValues: { placements: EMPTY_PLACEMENTS },
  });

  const onSubmit = async (data: FfaFormValues) => {
    try {
      const parsed = schema.parse(data.placements);
      await completeFfaMatch.mutateAsync(parsed as FfaPlacements);
      const winnerName =
        participants.find((p) => p.userId === parsed.winnerUserId)?.displayName ?? "Unknown";
      toast(`${winnerName} wins!`, { type: "success" });
    } catch (error) {
      if (error && typeof error === "object" && "issues" in error) {
        const zodError = error as { issues: { message: string }[] };
        for (const issue of zodError.issues) {
          toast(issue.message, { type: "error" });
        }
      } else {
        toast("Server error", { type: "error" });
      }
    }
  };

  return (
    <Box>
      <Typography
        variant="h4"
        mb={2}
        fontWeight="bold"
        sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" } }}
      >
        Register FFA Result
      </Typography>

      <Box mb={3}>
        <PodiumPickerField
          control={control}
          name="placements"
          playerCount={playerCount}
          players={participants}
          rules={{ allowWinnerOnly: !requireFullPodium, requireFullPodium }}
        />
      </Box>

      <Button
        variant="contained"
        fullWidth
        sx={{
          mt: 2,
          py: 1.5,
          fontWeight: "bold",
          fontSize: "1rem",
        }}
        disabled={isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
        onClick={handleSubmit(onSubmit)}
      >
        {isSubmitting ? "Completing..." : "Complete FFA Match"}
      </Button>
    </Box>
  );
}
