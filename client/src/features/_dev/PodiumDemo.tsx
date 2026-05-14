import { Box, Divider, Paper, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import PlayerCountToggle from "../../app/shared/components/PlayerCountToggle";
import PodiumDisplay from "../../app/shared/components/PodiumDisplay";
import PodiumPicker from "../../app/shared/components/PodiumPicker";
import type { FfaPlacements } from "../../app/shared/components/PodiumPickerField";
import PodiumPickerField from "../../app/shared/components/PodiumPickerField";
import type { PodiumRank } from "../../lib/hooks/usePodiumState";
import { usePodiumState } from "../../lib/hooks/usePodiumState";

const MOCK_PLAYERS = [
  { userId: "user-1", displayName: "Lars", imageUrl: undefined },
  { userId: "user-2", displayName: "Per", imageUrl: undefined },
  { userId: "user-3", displayName: "Mia", imageUrl: undefined },
  { userId: "user-4", displayName: "Ola", imageUrl: undefined, isGuest: true },
];

const MOCK_PLACEMENTS = {
  winner: MOCK_PLAYERS[0],
  second: MOCK_PLAYERS[1],
  third: MOCK_PLAYERS[2],
  fourth: MOCK_PLAYERS[3],
};

const WINNER_ONLY_PLACEMENTS = {
  winner: MOCK_PLAYERS[0],
};

function LivePicker({ playerCount }: { playerCount: 2 | 3 | 4 }) {
  const [value, setValue] = useState<Map<PodiumRank, string | null>>(new Map([
    [1, null], [2, null], [3, null], [4, null],
  ]));

  const players = useMemo(
    () => MOCK_PLAYERS.slice(0, playerCount),
    [playerCount],
  );

  const hookReturn = usePodiumState({
    playerCount,
    value,
    onChange: setValue,
    rules: { requireFullPodium: false, allowWinnerOnly: true },
    players,
  });

  const state = {
    ...hookReturn,
    value,
    onChange: setValue,
    rules: { requireFullPodium: false, allowWinnerOnly: true },
    playerCount,
  };

  return <PodiumPicker state={state} players={players} />;
}

type DemoFormValues = {
  placements: FfaPlacements;
};

function RhfAdapterDemo() {
  const { control, watch } = useForm<DemoFormValues>({
    defaultValues: {
      placements: {
        winnerUserId: null,
        secondPlaceUserId: null,
        thirdPlaceUserId: null,
        fourthPlaceUserId: null,
      },
    },
  });
  const placements = watch("placements");
  const players = useMemo(() => MOCK_PLAYERS, []);

  return (
    <Box>
      <PodiumPickerField
        control={control}
        name="placements"
        playerCount={4}
        players={players}
        rules={{ requireFullPodium: false, allowWinnerOnly: true }}
      />
      <Box mt={2}>
        <Typography variant="caption" color="text.secondary">
          RHF state: {JSON.stringify(placements, null, 2)}
        </Typography>
      </Box>
    </Box>
  );
}

export default function PodiumDemo() {
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(4);

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h4" fontWeight="bold" mb={1}>
        Podium Picker Dev Demo
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Visual QA for PodiumPicker, PodiumDisplay, PodiumPickerField, PlayerCountToggle.
      </Typography>

      {/* PlayerCountToggle */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          PlayerCountToggle
        </Typography>
        <PlayerCountToggle value={playerCount} onChange={setPlayerCount} />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          Selected: {playerCount}
        </Typography>
        <Box mt={2}>
          <PlayerCountToggle
            value={2}
            onChange={setPlayerCount}
            disabled
            helperText="Locked once league is activated"
          />
        </Box>
      </Paper>

      <Divider sx={{ my: 2 }} />

      {/* PodiumPicker (bare hook, with live state) */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          PodiumPicker (bare hook, {playerCount}-player)
        </Typography>
        <LivePicker playerCount={playerCount} />
      </Paper>

      <Divider sx={{ my: 2 }} />

      {/* PodiumPickerField (RHF adapter) */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          PodiumPickerField (RHF adapter, 4-player)
        </Typography>
        <RhfAdapterDemo />
      </Paper>

      <Divider sx={{ my: 2 }} />

      {/* PodiumDisplay (read-only, all placements) */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          PodiumDisplay — full podium
        </Typography>
        <PodiumDisplay
          placements={MOCK_PLACEMENTS}
          participants={MOCK_PLAYERS}
          collapseRule="never"
        />
      </Paper>

      <Divider sx={{ my: 2 }} />

      {/* PodiumDisplay (read-only, winner-only) */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          PodiumDisplay — winner-only (collapseRule)
        </Typography>
        <PodiumDisplay
          placements={WINNER_ONLY_PLACEMENTS}
          participants={MOCK_PLAYERS}
          collapseRule="winner-only"
        />
      </Paper>

      <Divider sx={{ my: 2 }} />

      {/* Viewport indicator */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={1}>
          Viewport indicator
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Resize window to 320px to test mobile layout.
        </Typography>
        <Box
          sx={{
            display: { xs: "block", sm: "none" },
            mt: 1,
            px: 1.5,
            py: 0.5,
            bgcolor: "warning.main",
            color: "warning.contrastText",
            borderRadius: 1,
            width: "fit-content",
          }}
        >
          <Typography variant="caption" fontWeight="bold">
            Mobile (xs)
          </Typography>
        </Box>
        <Box
          sx={{
            display: { xs: "none", sm: "block", md: "none" },
            mt: 1,
            px: 1.5,
            py: 0.5,
            bgcolor: "info.main",
            color: "info.contrastText",
            borderRadius: 1,
            width: "fit-content",
          }}
        >
          <Typography variant="caption" fontWeight="bold">
            Tablet (sm)
          </Typography>
        </Box>
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            mt: 1,
            px: 1.5,
            py: 0.5,
            bgcolor: "success.main",
            color: "success.contrastText",
            borderRadius: 1,
            width: "fit-content",
          }}
        >
          <Typography variant="caption" fontWeight="bold">
            Desktop (md+)
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
