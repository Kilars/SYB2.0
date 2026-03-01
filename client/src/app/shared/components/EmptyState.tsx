import { Box, Button, Paper, Typography } from "@mui/material";
import { Link } from "react-router";
import { useAppTheme } from "../../context/ThemeContext";

type ActionProps = {
    label: string;
    href?: string;
    onClick?: () => void;
}

type Props = {
    icon: React.ReactNode;
    message: string;
    action?: ActionProps;
}

export default function EmptyState({ icon, message, action }: Props) {
    const { meta } = useAppTheme();

    const buttonSx = {
        mt: 1,
        background: meta.accentGradient,
        color: 'white',
        '&:hover': { opacity: 0.85 },
    };

    return (
        <Paper
            elevation={0}
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 8,
                px: 3,
                gap: 2,
                borderRadius: 3,
                border: '2px dashed',
                borderColor: 'divider',
                bgcolor: meta.surfaceTint,
                '@keyframes fadeInUp': {
                    from: { opacity: 0, transform: 'translateY(16px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                },
                animation: 'fadeInUp 0.4s ease-out',
            }}
        >
            <Box sx={{
                fontSize: 48,
                display: 'flex',
                alignItems: 'center',
                color: 'primary.main',
                opacity: 0.6,
                '@keyframes bounceIn': {
                    '0%': { transform: 'scale(0.5)', opacity: 0 },
                    '60%': { transform: 'scale(1.1)' },
                    '100%': { transform: 'scale(1)', opacity: 0.6 },
                },
                animation: 'bounceIn 0.5s ease-out',
            }}>
                {icon}
            </Box>
            <Typography variant="body1" textAlign="center" color="text.secondary" fontWeight={500}>
                {message}
            </Typography>
            {action && (
                action.href ? (
                    <Button variant="contained" component={Link} to={action.href} sx={buttonSx}>
                        {action.label}
                    </Button>
                ) : (
                    <Button variant="contained" onClick={action.onClick} sx={buttonSx}>
                        {action.label}
                    </Button>
                )
            )}
        </Paper>
    );
}
