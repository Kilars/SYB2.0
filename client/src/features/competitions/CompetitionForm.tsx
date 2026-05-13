import { zodResolver } from "@hookform/resolvers/zod";
import { Add, EmojiEvents, Leaderboard, Save } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import { startOfToday } from "date-fns";
import { useEffect } from "react";
import { type Control, Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";

import DateTimeInput from "../../app/shared/components/DateTimeInput";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import PlayerCountToggle from "../../app/shared/components/PlayerCountToggle";
import TextInput from "../../app/shared/components/TextInput";
import UserSelectInput from "../../app/shared/components/UserSelectInput";
import { useAccount } from "../../lib/hooks/useAccount";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { useTournaments } from "../../lib/hooks/useTournaments";
import { useUsers } from "../../lib/hooks/useUsers";
import {
  type LeagueSchema,
  leagueSchema,
  type TournamentSchema,
  tournamentSchema,
} from "../../lib/schemas/competitionSchema";

interface CompetitionFormProps {
  type: "league" | "tournament";
}

export default function CompetitionForm({ type }: CompetitionFormProps) {
  const isLeague = type === "league";
  const { competitionId } = useParams();
  const isEditMode = isLeague && !!competitionId;

  const { users, createGuest } = useUsers();
  const { currentUser } = useAccount();
  const { createLeague, updateLeague, league, isLeagueLoading } = useLeagues(
    isEditMode ? competitionId : undefined,
  );
  const { createTournament } = useTournaments();
  const navigate = useNavigate();

  const schema = isLeague ? leagueSchema : tournamentSchema;

  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting, isDirty },
    reset,
  } = useForm({
    mode: "onTouched",
    resolver: zodResolver(schema),
    defaultValues: {
      bestOf: 3,
      startDate: startOfToday(),
    },
  });

  const onSubmit = async (data: LeagueSchema | TournamentSchema) => {
    if (isLeague) {
      const leagueData = data as LeagueSchema;
      if (!league) {
        await createLeague.mutateAsync(leagueData, {
          onSuccess: (id) => navigate(`/leagues/${id}/leaderboard`),
        });
      } else {
        await updateLeague.mutateAsync(
          { ...league, ...leagueData },
          {
            onSuccess: () => navigate(`/leagues/${league.id}/leaderboard`),
          },
        );
      }
    } else {
      const tournamentData = data as TournamentSchema;
      await createTournament.mutateAsync(tournamentData, {
        onSuccess: (id) => navigate(`/tournaments/${id}`),
      });
    }
  };

  useEffect(() => {
    if (league) reset({ ...league, playerCount: (league.playerCount ?? 2) as 2 | 3 | 4 });
  }, [reset, league]);

  if (isEditMode && isLeagueLoading) return <LoadingSkeleton variant="detail" />;

  const Icon = isLeague ? Leaderboard : EmojiEvents;
  const heading = isEditMode
    ? "Edit League"
    : isLeague
      ? "Create League"
      : "Create Tournament";
  const submitLabel = isSubmitting
    ? "Saving..."
    : isEditMode
      ? "Save Changes"
      : isLeague
        ? "Create League"
        : "Create Tournament";
  const memberLabel = isLeague ? "Add members" : "Add players (4, 8, 16, or 32)";

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        display: "flex",
        flexDirection: "column",
        p: { xs: 2, sm: 3 },
        gap: 3,
        maxWidth: "md",
        mx: "auto",
        borderRadius: 3,
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        gap={3}
        color="secondary.main"
      >
        <Icon fontSize="large" />
        <Typography variant="h4">{heading}</Typography>
      </Box>
      <Box display="flex" flexDirection="column" gap={3}>
        <TextInput label="Title" control={control} name="title" />
        <TextInput label="Description" control={control} name="description" />
        {isLeague && (
          <Controller
            name="playerCount"
            control={control as unknown as Control}
            defaultValue={2}
            render={({ field }) => (
              <PlayerCountToggle
                value={((field.value as number) || 2) as 2 | 3 | 4}
                onChange={field.onChange}
                disabled={!!(league?.status && league.status !== 0)}
                helperText={
                  league?.status && league.status !== 0
                    ? "Locked once league is activated"
                    : undefined
                }
              />
            )}
          />
        )}
        <DateTimeInput
          label="Date"
          control={control}
          name="startDate"
          defaultValue={startOfToday()}
        />

        <Controller
          name="bestOf"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Best Of</InputLabel>
              <Select {...field} label="Best Of">
                <MenuItem value={1}>Best of 1</MenuItem>
                <MenuItem value={3}>Best of 3</MenuItem>
                <MenuItem value={5}>Best of 5</MenuItem>
              </Select>
            </FormControl>
          )}
        />

        {users && currentUser && (
          <UserSelectInput
            label={memberLabel}
            control={control}
            name="members"
            users={users}
            currentUser={currentUser}
            defaultValue={[{ userId: currentUser.id, displayName: currentUser.displayName }]}
            onCreateGuest={async (displayName) => await createGuest.mutateAsync(displayName)}
          />
        )}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Button color="inherit" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isDirty || !isValid || isSubmitting}
            size="large"
            startIcon={
              isSubmitting ? (
                <CircularProgress size={20} />
              ) : isEditMode ? (
                <Save />
              ) : (
                <Add />
              )
            }
            sx={{
              fontWeight: "bold",
              px: 3,
              "&:focus-visible": {
                outline: "2px solid",
                outlineColor: "primary.main",
                outlineOffset: 2,
              },
            }}
          >
            {submitLabel}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
