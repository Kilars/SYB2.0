import { useState } from "react";
import { Avatar, Box, Button, Chip, FormControl, FormHelperText, InputLabel, MenuItem, Select, TextField, Typography, type SelectChangeEvent, type SelectProps } from "@mui/material";
import { useController, type UseControllerProps, type FieldValues } from "react-hook-form"
import { PersonAdd } from "@mui/icons-material";

type Props<T extends FieldValues> = {
    label: string,
    users: User[],
    currentUser: User,
    onCreateGuest?: (displayName: string) => Promise<User>,
} & UseControllerProps<T> & Partial<SelectProps>

export default function UserSelectInput<T extends FieldValues>(props: Props<T>) {
    const { field, fieldState } = useController({ ...props });
    const members: LeagueMember[] = field.value ?? [];
    const availableUsersList: User[] = props.users?.filter(user => !members?.map(members => members.userId).includes(user.id));
    const [guestName, setGuestName] = useState('');
    const [isCreatingGuest, setIsCreatingGuest] = useState(false);

    const addMember = (event: SelectChangeEvent) => {
        const addUser = props.users?.find(user => user.id === event.target.value)
        if (addUser) field.onChange([...members, { userId: addUser.id, displayName: addUser.displayName }])
    }

    const handleCreateGuest = async () => {
        if (!guestName.trim() || !props.onCreateGuest) return;
        setIsCreatingGuest(true);
        try {
            const guest = await props.onCreateGuest(guestName.trim());
            field.onChange([...members, { userId: guest.id, displayName: guest.displayName }]);
            setGuestName('');
        } finally {
            setIsCreatingGuest(false);
        }
    }

    const getDisplayLabel = (user: { displayName: string; isGuest?: boolean }) => {
        return user.isGuest ? `${user.displayName} (guest)` : user.displayName;
    }

    return (
        <>
            <Typography variant="h5">Members</Typography>
            <Box>
                {members?.map(member => {
                    const user = props.users?.find(u => u.id === member.userId);
                    return (
                        <Chip
                            key={member.userId}
                            label={getDisplayLabel({ displayName: member.displayName, isGuest: user?.isGuest })}
                            onDelete={() => {
                                field.onChange(members.filter(m => m.userId !== member.userId))
                            }}
                            sx={{ mr: 1 }}
                        />
                    );
                })}
            </Box>
            <FormControl fullWidth error={!!fieldState.error}>
                <InputLabel>{props.label}</InputLabel>
                <Select
                    value={''}
                    disabled={availableUsersList.length === 0}
                    label={props.label}
                    onChange={addMember}
                    sx={{
                        height: 'unset',
                        '& .MuiSelect-select': {
                            height: 0
                        },
                    }}
                >
                    {availableUsersList.map(user => (
                        <MenuItem key={user.id} value={user.id}>
                            <Box display='flex' alignItems='center' sx={{ height: '100%' }}>
                                <Avatar src={user.imageUrl} alt='current user image' sx={{ mr: 2 }}>
                                    {user.imageUrl ? <></> : user.displayName[0]}
                                </Avatar>
                                <Typography variant="body1">
                                    {getDisplayLabel(user)}
                                </Typography>
                            </Box>
                        </MenuItem>
                    ))}
                </Select>
                <FormHelperText>{fieldState?.error?.message}</FormHelperText>
            </FormControl>
            {props.onCreateGuest && (
                <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
                    <TextField
                        size="small"
                        label="Guest name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateGuest();
                            }
                        }}
                        disabled={isCreatingGuest}
                        sx={{ flex: 1 }}
                    />
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<PersonAdd />}
                        onClick={handleCreateGuest}
                        disabled={!guestName.trim() || isCreatingGuest}
                    >
                        Add Guest
                    </Button>
                </Box>
            )}
        </>
    )
}
