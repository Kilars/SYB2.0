import { Delete, DeleteOutline } from "@mui/icons-material";
import { Box, Button } from "@mui/material";

export default function DeleteButton() {
    return (
        <Box sx={{ position: 'relative' }}>
            <Button
                aria-label="Delete"
                sx={{
                    opacity: 0.8,
                    transition: 'opacity 0.3s, transform 0.2s',
                    position: 'relative',
                    cursor: 'pointer',
                    '&:hover': { opacity: 1, transform: 'scale(1.1)' },
                    '&:focus-visible': {
                        outline: '2px solid',
                        outlineColor: 'error.main',
                        outlineOffset: 2,
                        opacity: 1,
                    },
                }}
            >
                <DeleteOutline
                    sx={{
                        fontSize: 32,
                        color: 'white',
                        position: 'absolute'
                    }}
                />
                <Delete
                    sx={{ fontSize: 28, color: 'error.main' }}
                />
            </Button>
        </Box>
    )
}
