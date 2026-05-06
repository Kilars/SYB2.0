import { zodResolver } from "@hookform/resolvers/zod";
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
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { SMASH_COLORS } from "../../app/theme";
import { useAccount } from "../../lib/hooks/useAccount";
import { useCasual } from "../../lib/hooks/useCasual";
import { useUsers } from "../../lib/hooks/useUsers";
import { type CasualMatchSchema,casualMatchSchema } from "../../lib/schemas/casualSchema";
import CharacterSelect from "../matches/CharacterSelect";

type Props = {
  open: boolean;
  onClose: () => void;
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
  } = useForm<CasualMatchSchema>({
    resolver: zodResolver(casualMatchSchema),
    defaultValues: {
      playerOneUserId: currentUser?.id || "",
      playerTwoUserId: "",
      playerOneCharacterId: "",
      playerTwoCharacterId: "",
      winnerUserId: "",
    },
  });

  const playerOneUserId = watch("playerOneUserId");
  const playerTwoUserId = watch("playerTwoUserId");

  const playerOneName =
    users?.find((u) => u.id === playerOneUserId)?.displayName || "Player 1";
  const playerTwoName =
    users?.find((u) => u.id === playerTwoUserId)?.displayName || "Player 2";

  const onSubmit = async (data: CasualMatchSchema) => {
    try {
      await createCasualMatch.mutateAsync(data);
      toast.success("Casual match registered!");
      reset();
      onClose();
    } catch {
      toast.error("Failed to create casual match");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Casual Match</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          {/* Player One */}
          <Controller
            name="playerOneUserId"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={users || []}
                getOptionLabel={(option) => option.displayName}
                value={users?.find((u) => u.id === field.value) || null}
                onChange={(_e, newValue) => {
                  field.onChange(newValue?.id || "");
                  if (watch("winnerUserId") && newValue?.id !== watch("winnerUserId")) {
                    const p2 = watch("playerTwoUserId");
                    if (watch("winnerUserId") !== p2 && watch("winnerUserId") !== newValue?.id) {
                      setValue("winnerUserId", "");
                    }
                  }
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
                options={(users || []).filter((u) => u.id !== playerOneUserId)}
                getOptionLabel={(option) => option.displayName}
                value={users?.find((u) => u.id === field.value) || null}
                onChange={(_e, newValue) => {
                  field.onChange(newValue?.id || "");
                  if (watch("winnerUserId") && newValue?.id !== watch("winnerUserId")) {
                    const p1 = watch("playerOneUserId");
                    if (watch("winnerUserId") !== p1 && watch("winnerUserId") !== newValue?.id) {
                      setValue("winnerUserId", "");
                    }
                  }
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

          {/* Characters */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" mb={0.5}>
                {playerOneName}'s Character
              </Typography>
              <Controller
                name="playerOneCharacterId"
                control={control}
                render={({ field }) => (
                  <CharacterSelect selectedId={field.value} onChange={(id) => field.onChange(id || "")} userId={playerOneUserId || undefined} />
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
                  <CharacterSelect selectedId={field.value} onChange={(id) => field.onChange(id || "")} userId={playerTwoUserId || undefined} />
                )}
              />
              {errors.playerTwoCharacterId && (
                <Typography variant="caption" color="error">
                  {errors.playerTwoCharacterId.message}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Winner */}
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
