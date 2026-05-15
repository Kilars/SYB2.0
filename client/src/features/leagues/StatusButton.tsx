import { ArrowBack, CheckCircle, Delete, PlayArrow, Warning } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";

import PlayerCountToggle from "../../app/shared/components/PlayerCountToggle";
import { SMASH_COLORS } from "../../app/theme";
import { useLeagues } from "../../lib/hooks/useLeagues";

type Props = {
  competitionId: string;
  leagueStatus: number;
};
export default function StatusButton({ competitionId, leagueStatus }: Props) {
  const [open, setOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<number | undefined>(undefined);
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const { updateStatus } = useLeagues(competitionId);

  const onSubmit = async (changeStatusTo: number | { status: number; playerCount?: number }) => {
    await updateStatus.mutateAsync(changeStatusTo);
  };

  const handleClick = (changeStatusTo: number) => {
    // Destructive backward transitions require confirmation
    if (changeStatusTo === 0 || changeStatusTo === 1) {
      setPendingStatus(changeStatusTo);
      setOpen(true);
      return;
    }
    onSubmit(changeStatusTo);
  };

  const confirmDialogText =
    pendingStatus === 0
      ? "Are you sure you want to move back to planning phase? This will delete all existing match data for this league."
      : "Are you sure you want to reopen this league? The league will return to active status.";

  const isDestructive = pendingStatus === 0;

  if (leagueStatus === 1) {
    return (
      <>
        <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
          <Button
            color="success"
            variant="contained"
            onClick={() => onSubmit(2)}
            disabled={updateStatus.isPending}
            startIcon={updateStatus.isPending ? <CircularProgress size={18} /> : <CheckCircle />}
            sx={{ fontWeight: "bold" }}
          >
            <Typography variant="button">Finish League</Typography>
          </Button>
          <Button
            color="warning"
            variant="contained"
            onClick={() => handleClick(0)}
            disabled={updateStatus.isPending}
            startIcon={<ArrowBack />}
          >
            <Typography variant="button">Revert to Draft</Typography>
          </Button>
        </Stack>
        <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="status-dialog-title">
          <DialogTitle
            id="status-dialog-title"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Warning sx={{ color: isDestructive ? SMASH_COLORS.p1Red : SMASH_COLORS.p3Yellow }} />
            Change league status
          </DialogTitle>
          <DialogContent>
            <DialogContentText>{confirmDialogText}</DialogContentText>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-end",
                mt: 2,
                gap: 1,
              }}
            >
              <Button variant="outlined" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                color="error"
                variant="contained"
                onClick={() => {
                  setOpen(false);
                  if (pendingStatus !== undefined) onSubmit(pendingStatus);
                }}
              >
                <Delete sx={{ mr: 0.5 }} />
                Yes (delete matches)
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  let text = "";
  let icon = undefined;
  let color: "success" | "warning" | "primary" = "primary";
  let changeStatusTo = 0;
  switch (leagueStatus) {
    case 0:
      text = "Start league";
      icon = <PlayArrow />;
      color = "success";
      changeStatusTo = 1;
      break;
    case 2:
      text = "Reopen";
      icon = <ArrowBack />;
      color = "warning";
      changeStatusTo = 1;
      break;
    default:
      changeStatusTo = 1;
      break;
  }

  return (
    <>
      <Stack spacing={1} sx={{ ml: 2 }}>
        {leagueStatus === 0 && (
          <PlayerCountToggle value={playerCount} onChange={setPlayerCount} />
        )}
        <Button
          sx={{ fontWeight: "bold" }}
          color={color}
          variant="contained"
          disabled={updateStatus.isPending}
          onClick={() => handleClick(changeStatusTo)}
        >
          {updateStatus.isPending ? <CircularProgress size={18} sx={{ mr: 1 }} /> : icon}
          <Typography variant="button" ml={1}>
            {text}
          </Typography>
        </Button>
      </Stack>
      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="status-dialog-title">
        <DialogTitle
          id="status-dialog-title"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Warning sx={{ color: SMASH_COLORS.p3Yellow }} />
          Change league status
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialogText}</DialogContentText>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
              mt: 2,
              gap: 1,
            }}
          >
            <Button variant="outlined" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              color="warning"
              variant="contained"
              onClick={() => {
                setOpen(false);
                if (pendingStatus === undefined) return;
                if (pendingStatus === 1 && leagueStatus === 0) {
                  onSubmit({ status: 1, playerCount });
                } else {
                  onSubmit(pendingStatus);
                }
              }}
            >
              Yes, proceed
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
