import { Avatar, Box, Chip, FormControl, FormHelperText, InputLabel, MenuItem, Select, Typography, type SelectChangeEvent, type SelectProps } from "@mui/material";
import { useController, type UseControllerProps, type FieldValues } from "react-hook-form"


type Props<T extends FieldValues> = { label: string, users: User[], currentUser: User } & UseControllerProps<T> & Partial<SelectProps>

export default function UserSelectInput<T extends FieldValues>(props: Props<T>) {
    const { field, fieldState } = useController({ ...props });
    const members : LeagueMember[] = field.value ?? [];
    const availableUsersList : User[] = props.users?.filter(user => !members?.map(members => members.userId).includes(user.id));

    const addMember = (event: SelectChangeEvent) => {
        const addUser = props.users?.find(user => user.id === event.target.value)
        if (addUser) field.onChange([...members, { userId: addUser.id, displayName: addUser.displayName }])
    }

    return (
        <>
            <Typography variant="h5">Members</Typography>
            <Box>
                {members?.map(member =>
                    <Chip
                        key={member.userId}
                        label={member.displayName}
                        onDelete={() => {
                            field.onChange(members.filter(m => m.userId !== member.userId))
                        }}
                        sx={{ mr: 1 }}
                    />
                )}
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
                                    {user.displayName}
                                </Typography>
                            </Box>
                        </MenuItem>
                    ))}
                </Select>
                <FormHelperText>{fieldState?.error?.message}</FormHelperText>
            </FormControl>
        </>
    )
}
