import { Merge, Person } from "@mui/icons-material";
import { Box, Chip, IconButton } from "@mui/material";
import { Link } from "react-router";
import ColorHash from "color-hash";

type Props = {
    userId: string;
    displayName: string;
    isGuest?: boolean;
    onMerge?: () => void;
}
export default function UserChip({ userId, displayName, isGuest, onMerge }: Props) {
    const colorHash = new ColorHash();
    const label = isGuest ? `${displayName} (guest)` : displayName;
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip
                icon={<Person />}
                label={label}
                color={'default'}
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    flexGrow: 1,
                    minWidth: 0,
                    '& .MuiChip-icon': { color: colorHash.hex(displayName) }
                }}
                clickable
                component={Link}
                to={`/user/${userId.split('_')[0]}`}
            />
            {onMerge && (
                <IconButton
                    size="small"
                    onClick={(e) => { e.preventDefault(); onMerge(); }}
                    title="Merge guest into registered user"
                >
                    <Merge fontSize="small" />
                </IconButton>
            )}
        </Box>
    )
}
