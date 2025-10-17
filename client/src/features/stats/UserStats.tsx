import { Box, Typography } from "@mui/material";
import { useParams } from "react-router";

export default function UserStats() {
    const { id } = useParams();

    if (!id) return <Typography>User not found</Typography>
    return (
        <Box>
            {id}
            <Box>User stats</Box>
        </Box>
    )
}