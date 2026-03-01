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
    const userColor = colorHash.hex(displayName);
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
                    fontWeight: 600,
                    borderLeft: `3px solid ${userColor}`,
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    '& .MuiChip-icon': { color: userColor },
                    '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 2px 8px ${userColor}33`,
                    },
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
                    sx={{ color: 'warning.main' }}
                >
                    <Merge fontSize="small" />
                </IconButton>
            )}
        </Box>
    )
}
