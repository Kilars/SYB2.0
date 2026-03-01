import { useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    type SelectChangeEvent,
} from "@mui/material";
import { toast } from "react-toastify";
import { useUsers } from "../../lib/hooks/useUsers";

type Props = {
    guestUserId: string;
    guestDisplayName: string;
    open: boolean;
    onClose: () => void;
}

export default function MergeGuestDialog({ guestUserId, guestDisplayName, open, onClose }: Props) {
    const { users, mergeGuest } = useUsers();
    const [targetUserId, setTargetUserId] = useState('');

    const registeredUsers = users?.filter(u => !u.isGuest && u.id !== guestUserId) ?? [];

    const handleMerge = async () => {
        if (!targetUserId) return;
        try {
            await mergeGuest.mutateAsync({ guestUserId, targetUserId });
            toast('Guest merged successfully', { type: 'success' });
            onClose();
        } catch {
            toast('Failed to merge guest', { type: 'error' });
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Merge Guest User</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Merge <strong>{guestDisplayName}</strong> into a registered user. All match history and statistics will be transferred to the selected user.
                </DialogContentText>
                <FormControl fullWidth>
                    <InputLabel>Select registered user</InputLabel>
                    <Select
                        value={targetUserId}
                        label="Select registered user"
                        onChange={(e: SelectChangeEvent) => setTargetUserId(e.target.value)}
                    >
                        {registeredUsers.map(user => (
                            <MenuItem key={user.id} value={user.id}>
                                {user.displayName}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleMerge}
                    variant="contained"
                    color="warning"
                    disabled={!targetUserId || mergeGuest.isPending}
                >
                    Merge
                </Button>
            </DialogActions>
        </Dialog>
    );
}
