import { Person } from "@mui/icons-material";
import { Chip } from "@mui/material";
import { Link } from "react-router";
import ColorHash from "color-hash";

type Props = {
    userId: string;
    displayName: string;
}
export default function UserChip({ userId, displayName }: Props) {
    const colorHash = new ColorHash();
    return (
        <Chip
            icon={<Person />}
            label={displayName}
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
    )
}