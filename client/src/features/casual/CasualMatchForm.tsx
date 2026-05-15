import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import PlayerCountToggle from "../../app/shared/components/PlayerCountToggle";
import PodiumPickerField, {
  type FfaPlacements,
} from "../../app/shared/components/PodiumPickerField";
import { SMASH_COLORS } from "../../app/theme";
import { useAccount } from "../../lib/hooks/useAccount";
import { useCasual } from "../../lib/hooks/useCasual";
import type { PodiumPlayer } from "../../lib/hooks/usePodiumState";
import { useUsers } from "../../lib/hooks/useUsers";
import { makeCasualMatchSchema } from "../../lib/schemas/casualSchema";
import CharacterSelect from "../matches/CharacterSelect";

type Props = {
  open: boolean;
  onClose: () => void;
};

const EMPTY_FFA_PLACEMENTS: FfaPlacements = {
  winnerUserId: null,
  secondPlaceUserId: null,
  thirdPlaceUserId: null,
  fourthPlaceUserId: null,
};

type FormValues = {
  playerCount: 2 | 3 | 4;
  playerOneUserId: string;
  playerTwoUserId: string;
  playerThreeUserId?: string;
  playerFourUserId?: string;
  playerOneCharacterId?: string;
  playerTwoCharacterId?: string;
  playerThreeCharacterId?: string;
  playerFourCharacterId?: string;
  winnerUserId: string;
  // FFA placements (N>2): stored as an FfaPlacements object under a single RHF field
  ffaPlacements?: FfaPlacements;
};

export default function CasualMatchForm({ open, onClose }: Props) {
  const { users } = useUsers();
  const { currentUser } = useAccount();
  const { createCasualMatch } = useCasual();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      playerCount: 2,
      playerOneUserId: currentUser?.id || "",
      playerTwoUserId: "",
      playerThreeUserId: "",
      playerFourUserId: "",
      playerOneCharacterId: "",
      playerTwoCharacterId: "",
      playerThreeCharacterId: "",
      playerFourCharacterId: "",
      winnerUserId: "",
      ffaPlacements: EMPTY_FFA_PLACEMENTS,
    },
  });

  const playerCount = watch("playerCount");
  const playerOneUserId = watch("playerOneUserId");
  const playerTwoUserId = watch("playerTwoUserId");
  const playerThreeUserId = watch("playerThreeUserId");
  const playerFourUserId = watch("playerFourUserId");

  const playerOneName = users?.find((u) => u.id === playerOneUserId)?.displayName || "Player 1";
  const playerTwoName = users?.find((u) => u.id === playerTwoUserId)?.displayName || "Player 2";
  const playerThreeName =
    users?.find((u) => u.id === playerThreeUserId)?.displayName || "Player 3";
  const playerFourName = users?.find((u) => u.id === playerFourUserId)?.displayName || "Player 4";

  // Build stable participants list for PodiumPickerField (memoized to avoid spurious resets)
  const ffaParticipants: PodiumPlayer[] = useMemo(() => {
    const result: PodiumPlayer[] = [];
    const ids = [playerOneUserId, playerTwoUserId, playerThreeUserId, playerFourUserId].filter(
      (id): id is string => !!id && id !== "",
    );
    for (const id of ids) {
      const user = users?.find((u) => u.id === id);
      if (user) result.push({ userId: user.id, displayName: user.displayName });
    }
    return result;
  }, [playerOneUserId, playerTwoUserId, playerThreeUserId, playerFourUserId, users]);

  // participantsRef for Zod — always fresh, no stale closure
  const participantsRef = () =>
    [playerOneUserId, playerTwoUserId, playerThreeUserId, playerFourUserId].filter(
      (id): id is string => !!id && id !== "",
    );

  const schema = useMemo(
    () => makeCasualMatchSchema(participantsRef, playerCount),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playerCount, playerOneUserId, playerTwoUserId, playerThreeUserId, playerFourUserId],
  );

  const onSubmit = async (data: FormValues) => {
    // Validate N>2 with FFA schema; for N=2 RHF handles it via discriminated union
    try {
      if (playerCount === 2) {
        const parsed = schema.safeParse(data);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message || "Validation error");
          return;
        }
        await createCasualMatch.mutateAsync({
          playerCount: 2,
          playerOneUserId: data.playerOneUserId,
          playerTwoUserId: data.playerTwoUserId,
          playerOneCharacterId: data.playerOneCharacterId || undefined,
          playerTwoCharacterId: data.playerTwoCharacterId || undefined,
          winnerUserId: data.winnerUserId,
        });
      } else {
        // N>2: flatten FFA placements object into top-level DTO fields
        const placements = data.ffaPlacements ?? EMPTY_FFA_PLACEMENTS;
        if (!placements.winnerUserId) {
          toast.error("Winner is required");
          return;
        }
        const ffaData = {
          ...data,
          winnerUserId: placements.winnerUserId,
          secondPlaceUserId: placements.secondPlaceUserId,
          thirdPlaceUserId: placements.thirdPlaceUserId,
          fourthPlaceUserId: placements.fourthPlaceUserId,
        };
        const parsed = schema.safeParse(ffaData);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message || "Validation error");
          return;
        }
        await createCasualMatch.mutateAsync({
          playerCount,
          playerOneUserId: data.playerOneUserId,
          playerTwoUserId: data.playerTwoUserId,
          playerThreeUserId: data.playerThreeUserId || undefined,
          playerFourUserId: playerCount === 4 ? (data.playerFourUserId || undefined) : undefined,
          playerOneCharacterId: data.playerOneCharacterId || undefined,
          playerTwoCharacterId: data.playerTwoCharacterId || undefined,
          playerThreeCharacterId: data.playerThreeCharacterId || undefined,
          playerFourCharacterId: playerCount === 4 ? (data.playerFourCharacterId || undefined) : undefined,
          winnerUserId: placements.winnerUserId,
          secondPlaceUserId: placements.secondPlaceUserId,
          thirdPlaceUserId: placements.thirdPlaceUserId,
          fourthPlaceUserId:
            playerCount === 4 ? placements.fourthPlaceUserId : undefined,
        });
      }
      toast.success("Casual match registered!");
      reset({
        playerCount,
        playerOneUserId: currentUser?.id || "",
        playerTwoUserId: "",
        playerThreeUserId: "",
        playerFourUserId: "",
        playerOneCharacterId: "",
        playerTwoCharacterId: "",
        playerThreeCharacterId: "",
        playerFourCharacterId: "",
        winnerUserId: "",
        ffaPlacements: EMPTY_FFA_PLACEMENTS,
      });
      onClose();
    } catch {
      toast.error("Failed to create casual match");
    }
  };

  const excludedFromP2 = [playerOneUserId, playerThreeUserId, playerFourUserId].filter(Boolean);
  const excludedFromP3 = [playerOneUserId, playerTwoUserId, playerFourUserId].filter(Boolean);
  const excludedFromP4 = [playerOneUserId, playerTwoUserId, playerThreeUserId].filter(Boolean);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Casual Match</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          {/* Format toggle */}
          <Controller
            name="playerCount"
            control={control}
            render={({ field }) => (
              <PlayerCountToggle
                value={field.value}
                onChange={(val) => {
                  field.onChange(val);
                  // Clear player/character fields beyond the new N
                  if (val < 4) {
                    setValue("playerFourUserId", "");
                    setValue("playerFourCharacterId", "");
                  }
                  if (val < 3) {
                    setValue("playerThreeUserId", "");
                    setValue("playerThreeCharacterId", "");
                  }
                  setValue("winnerUserId", "");
                  setValue("ffaPlacements", EMPTY_FFA_PLACEMENTS);
                }}
              />
            )}
          />

          {/* Player One */}
          <Controller
            name="playerOneUserId"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={(users || []).filter(
                  (u) => ![playerTwoUserId, playerThreeUserId, playerFourUserId].includes(u.id),
                )}
                getOptionLabel={(option) => option.displayName}
                value={users?.find((u) => u.id === field.value) || null}
                onChange={(_e, newValue) => {
                  field.onChange(newValue?.id || "");
                  setValue("winnerUserId", "");
                  setValue("ffaPlacements", EMPTY_FFA_PLACEMENTS);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Player 1"
                    error={!!errors.playerOneUserId}
                    helperText={errors.playerOneUserId?.message}
                  />
                )}
              />
            )}
          />

          {/* Player Two */}
          <Controller
            name="playerTwoUserId"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={(users || []).filter((u) => !excludedFromP2.includes(u.id))}
                getOptionLabel={(option) => option.displayName}
                value={users?.find((u) => u.id === field.value) || null}
                onChange={(_e, newValue) => {
                  field.onChange(newValue?.id || "");
                  setValue("winnerUserId", "");
                  setValue("ffaPlacements", EMPTY_FFA_PLACEMENTS);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Player 2"
                    error={!!errors.playerTwoUserId}
                    helperText={errors.playerTwoUserId?.message}
                  />
                )}
              />
            )}
          />

          {/* Player Three (N>=3) */}
          {playerCount >= 3 && (
            <Controller
              name="playerThreeUserId"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={(users || []).filter((u) => !excludedFromP3.includes(u.id))}
                  getOptionLabel={(option) => option.displayName}
                  value={users?.find((u) => u.id === field.value) || null}
                  onChange={(_e, newValue) => {
                    field.onChange(newValue?.id || "");
                    setValue("ffaPlacements", EMPTY_FFA_PLACEMENTS);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Player 3"
                      error={!!errors.playerThreeUserId}
                      helperText={errors.playerThreeUserId?.message}
                    />
                  )}
                />
              )}
            />
          )}

          {/* Player Four (N=4) */}
          {playerCount === 4 && (
            <Controller
              name="playerFourUserId"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={(users || []).filter((u) => !excludedFromP4.includes(u.id))}
                  getOptionLabel={(option) => option.displayName}
                  value={users?.find((u) => u.id === field.value) || null}
                  onChange={(_e, newValue) => {
                    field.onChange(newValue?.id || "");
                    setValue("ffaPlacements", EMPTY_FFA_PLACEMENTS);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Player 4"
                      error={!!errors.playerFourUserId}
                      helperText={errors.playerFourUserId?.message}
                    />
                  )}
                />
              )}
            />
          )}

          {/* N=2: Character selects + winner toggle */}
          {playerCount === 2 && (
            <>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" mb={0.5}>
                    {playerOneName}'s Character
                  </Typography>
                  <Controller
                    name="playerOneCharacterId"
                    control={control}
                    render={({ field }) => (
                      <CharacterSelect
                        selectedId={field.value}
                        onChange={(id) => field.onChange(id || "")}
                        userId={playerOneUserId || undefined}
                      />
                    )}
                  />
                  {errors.playerOneCharacterId && (
                    <Typography variant="caption" color="error">
                      {errors.playerOneCharacterId.message}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" mb={0.5}>
                    {playerTwoName}'s Character
                  </Typography>
                  <Controller
                    name="playerTwoCharacterId"
                    control={control}
                    render={({ field }) => (
                      <CharacterSelect
                        selectedId={field.value}
                        onChange={(id) => field.onChange(id || "")}
                        userId={playerTwoUserId || undefined}
                      />
                    )}
                  />
                  {errors.playerTwoCharacterId && (
                    <Typography variant="caption" color="error">
                      {errors.playerTwoCharacterId.message}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" mb={0.5}>
                  Winner
                </Typography>
                <Controller
                  name="winnerUserId"
                  control={control}
                  render={({ field }) => (
                    <ToggleButtonGroup
                      value={field.value}
                      exclusive
                      fullWidth
                      onChange={(_e, val) => {
                        if (val) field.onChange(val);
                      }}
                    >
                      <ToggleButton
                        value={playerOneUserId}
                        disabled={!playerOneUserId}
                        sx={{
                          "&.Mui-selected": {
                            bgcolor: SMASH_COLORS.p1Red,
                            color: "white",
                            "&:hover": { bgcolor: SMASH_COLORS.p1Red },
                          },
                        }}
                      >
                        {playerOneName}
                      </ToggleButton>
                      <ToggleButton
                        value={playerTwoUserId}
                        disabled={!playerTwoUserId}
                        sx={{
                          "&.Mui-selected": {
                            bgcolor: SMASH_COLORS.p2Blue,
                            color: "white",
                            "&:hover": { bgcolor: SMASH_COLORS.p2Blue },
                          },
                        }}
                      >
                        {playerTwoName}
                      </ToggleButton>
                    </ToggleButtonGroup>
                  )}
                />
                {errors.winnerUserId && (
                  <Typography variant="caption" color="error">
                    {errors.winnerUserId.message}
                  </Typography>
                )}
              </Box>
            </>
          )}

          {/* N>2: Optional character selects + PodiumPickerField */}
          {playerCount > 2 && (
            <>
              {/* Optional character pickers */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" mb={0.5}>
                    {playerOneName}'s Character (optional)
                  </Typography>
                  <Controller
                    name="playerOneCharacterId"
                    control={control}
                    render={({ field }) => (
                      <CharacterSelect
                        selectedId={field.value}
                        onChange={(id) => field.onChange(id || "")}
                        userId={playerOneUserId || undefined}
                      />
                    )}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" mb={0.5}>
                    {playerTwoName}'s Character (optional)
                  </Typography>
                  <Controller
                    name="playerTwoCharacterId"
                    control={control}
                    render={({ field }) => (
                      <CharacterSelect
                        selectedId={field.value}
                        onChange={(id) => field.onChange(id || "")}
                        userId={playerTwoUserId || undefined}
                      />
                    )}
                  />
                </Box>
                {playerThreeUserId && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" mb={0.5}>
                      {playerThreeName}'s Character (optional)
                    </Typography>
                    <Controller
                      name="playerThreeCharacterId"
                      control={control}
                      render={({ field }) => (
                        <CharacterSelect
                          selectedId={field.value}
                          onChange={(id) => field.onChange(id || "")}
                          userId={playerThreeUserId || undefined}
                        />
                      )}
                    />
                  </Box>
                )}
                {playerCount === 4 && playerFourUserId && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" mb={0.5}>
                      {playerFourName}'s Character (optional)
                    </Typography>
                    <Controller
                      name="playerFourCharacterId"
                      control={control}
                      render={({ field }) => (
                        <CharacterSelect
                          selectedId={field.value}
                          onChange={(id) => field.onChange(id || "")}
                          userId={playerFourUserId || undefined}
                        />
                      )}
                    />
                  </Box>
                )}
              </Box>

              {/* Podium placements via PodiumPickerField (RHF adapter from task 043) */}
              <Box>
                <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
                  Placements (winner required; full podium optional)
                </Typography>
                <PodiumPickerField
                  control={control}
                  name="ffaPlacements"
                  playerCount={playerCount as 3 | 4}
                  players={ffaParticipants}
                  rules={{ allowWinnerOnly: true, requireFullPodium: false }}
                />
              </Box>
            </>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            sx={{ mt: 1 }}
          >
            {isSubmitting ? "Submitting..." : "Register Match"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
