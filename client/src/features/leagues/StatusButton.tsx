import { ArrowBack, Delete, PlayArrow } from "@mui/icons-material";
import { Box, Button, Dialog, Typography } from "@mui/material";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { useState } from "react";

type Props = {
    leagueId: string;
    leagueStatus: number;
}
export default function StatusButton({ leagueId, leagueStatus }: Props) {
    const [open, setOpen] = useState(false);
    const { updateStatus } = useLeagues(leagueId);

    let text = '';
    let icon = undefined;
    let changeStatusTo = undefined;
    switch (leagueStatus) {
        case 0:
            text = 'Start league';
            icon = <PlayArrow />
            changeStatusTo = 1;
            break;
        case 1:
            text = 'Set league to planning phase';
            icon = <ArrowBack />
            changeStatusTo = 0;
            break;
        case 2:
            text = 'Reopen league';
            icon = <ArrowBack />
            changeStatusTo = 1;
            break;
        default:
            changeStatusTo = 1;
            break;
    }
    const onClick = async () => {
        if (changeStatusTo === 0) {
            setOpen(true);
            return;
        }
        await onSubmit();
    }
    const onSubmit = async () => {
        await updateStatus.mutateAsync(changeStatusTo);
    }
    return (
        <>
            <Button sx={{ ml: 2 }} variant="contained" onClick={onClick}>
                {icon}
                <Typography variant="button" ml={1}>
                    {text}
                </Typography>
            </Button>
            <Dialog open={open}>
                <Box p={2}>
                    <Typography variant="h5">
                        Change league status
                    </Typography>
                    <Typography>
                        Are you sure you want to move back to planning phase? This will delete all existing match data for this league.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
                        <Box>
                            <Button variant="contained" onClick={() => setOpen(false)} sx={{ mr: 2 }}>
                                No
                            </Button>
                            <Button color="error" variant="contained" onClick={() => {
                                setOpen(false);
                                onSubmit()
                            }
                            }>
                                <Delete />
                                Yes (delete matches)
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Dialog>
        </>
    )
}