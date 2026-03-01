import { Box, Button, Typography } from "@mui/material";
import { Link } from "react-router";

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
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={6}
            gap={2}
            sx={{ color: 'text.secondary' }}
        >
            <Box sx={{ fontSize: 48, display: 'flex', alignItems: 'center', color: 'text.disabled' }}>
                {icon}
            </Box>
            <Typography variant="body1" textAlign="center">
                {message}
            </Typography>
            {action && (
                action.href ? (
                    <Button variant="contained" component={Link} to={action.href}>
                        {action.label}
                    </Button>
                ) : (
                    <Button variant="contained" onClick={action.onClick}>
                        {action.label}
                    </Button>
                )
            )}
        </Box>
    );
}
