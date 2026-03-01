import { ArrowBack, CheckCircle, Delete, PlayArrow } from "@mui/icons-material";
import { Box, Button, Dialog, DialogContent, DialogContentText, DialogTitle, Stack, Typography } from "@mui/material";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { useState } from "react";

type Props = {
    leagueId: string;
    leagueStatus: number;
}
export default function StatusButton({ leagueId, leagueStatus }: Props) {
    const [open, setOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<number | undefined>(undefined);
    const { updateStatus } = useLeagues(leagueId);

    const onSubmit = async (changeStatusTo: number) => {
        await updateStatus.mutateAsync(changeStatusTo);
    }

    const handleClick = (changeStatusTo: number) => {
        // Destructive backward transitions require confirmation
        if (changeStatusTo === 0 || changeStatusTo === 1) {
            setPendingStatus(changeStatusTo);
            setOpen(true);
            return;
        }
        onSubmit(changeStatusTo);
    }

    const confirmDialogText = pendingStatus === 0
        ? 'Are you sure you want to move back to planning phase? This will delete all existing match data for this league.'
        : 'Are you sure you want to reopen this league? The league will return to active status.';

    if (leagueStatus === 1) {
        return (
            <>
                <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
                    <Button
                        color="success"
                        variant="contained"
                        onClick={() => onSubmit(2)}
                        startIcon={<CheckCircle />}
                    >
                        <Typography variant="button">Finish League</Typography>
                    </Button>
                    <Button
                        color="warning"
                        variant="contained"
                        onClick={() => handleClick(0)}
                        startIcon={<ArrowBack />}
                    >
                        <Typography variant="button">Revert to Draft</Typography>
                    </Button>
                </Stack>
                <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="status-dialog-title">
                    <DialogTitle id="status-dialog-title">
                        Change league status
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {confirmDialogText}
                        </DialogContentText>
                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', mt: 2 }}>
                            <Box>
                                <Button variant="contained" onClick={() => setOpen(false)} sx={{ mr: 2 }}>
                                    No
                                </Button>
                                <Button color="error" variant="contained" onClick={() => {
                                    setOpen(false);
                                    if (pendingStatus !== undefined) onSubmit(pendingStatus);
                                }}>
                                    <Delete />
                                    Yes (delete matches)
                                </Button>
                            </Box>
                        </Box>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    let text = '';
    let icon = undefined;
    let color: 'success' | 'warning' | 'primary' = 'primary';
    let changeStatusTo = 0;
    switch (leagueStatus) {
        case 0:
            text = 'Start league';
            icon = <PlayArrow />;
            color = 'success';
            changeStatusTo = 1;
            break;
        case 2:
            text = 'Reopen';
            icon = <ArrowBack />;
            color = 'warning';
            changeStatusTo = 1;
            break;
        default:
            changeStatusTo = 1;
            break;
    }

    return (
        <>
            <Button sx={{ ml: 2 }} color={color} variant="contained" onClick={() => handleClick(changeStatusTo)}>
                {icon}
                <Typography variant="button" ml={1}>
                    {text}
                </Typography>
            </Button>
            <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="status-dialog-title">
                <DialogTitle id="status-dialog-title">
                    Change league status
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {confirmDialogText}
                    </DialogContentText>
                    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', mt: 2 }}>
                        <Box>
                            <Button variant="contained" onClick={() => setOpen(false)} sx={{ mr: 2 }}>
                                No
                            </Button>
                            <Button color="error" variant="contained" onClick={() => {
                                setOpen(false);
                                if (pendingStatus !== undefined) onSubmit(pendingStatus);
                            }}>
                                <Delete />
                                Yes
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    )
}
