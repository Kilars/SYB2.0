import { Box, Button, Paper, Typography } from "@mui/material";
import { Link } from "react-router";
import { SMASH_COLORS } from "../../theme";

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
                background: `linear-gradient(180deg, transparent 0%, ${SMASH_COLORS.p2Blue}08 100%)`,
            }}
        >
            <Box sx={{
                fontSize: 48,
                display: 'flex',
                alignItems: 'center',
                color: SMASH_COLORS.p2Blue,
                opacity: 0.6,
            }}>
                {icon}
            </Box>
            <Typography variant="body1" textAlign="center" color="text.secondary" fontWeight={500}>
                {message}
            </Typography>
            {action && (
                action.href ? (
                    <Button
                        variant="contained"
                        component={Link}
                        to={action.href}
                        sx={{
                            mt: 1,
                            background: `linear-gradient(135deg, ${SMASH_COLORS.p1Red}, ${SMASH_COLORS.p2Blue})`,
                            '&:hover': { background: `linear-gradient(135deg, ${SMASH_COLORS.p1Red}cc, ${SMASH_COLORS.p2Blue}cc)` },
                        }}
                    >
                        {action.label}
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        onClick={action.onClick}
                        sx={{
                            mt: 1,
                            background: `linear-gradient(135deg, ${SMASH_COLORS.p1Red}, ${SMASH_COLORS.p2Blue})`,
                            '&:hover': { background: `linear-gradient(135deg, ${SMASH_COLORS.p1Red}cc, ${SMASH_COLORS.p2Blue}cc)` },
                        }}
                    >
                        {action.label}
                    </Button>
                )
            )}
        </Paper>
    );
}
