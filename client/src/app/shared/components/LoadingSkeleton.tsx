import { Box, Skeleton } from "@mui/material";

type Props = {
    variant: 'list' | 'card' | 'detail' | 'table';
    count?: number;
}

export default function LoadingSkeleton({ variant, count = 3 }: Props) {
    if (variant === 'list') {
        return (
            <Box>
                {Array.from({ length: count }).map((_, i) => (
                    <Box key={i} mb={2}>
                        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
                    </Box>
                ))}
            </Box>
        );
    }

    if (variant === 'card') {
        return (
            <Box display="flex" flexDirection="column" gap={2}>
                {Array.from({ length: count }).map((_, i) => (
                    <Box key={i} p={2} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Skeleton variant="text" width="40%" height={32} />
                        <Skeleton variant="rectangular" height={60} sx={{ mt: 1 }} />
                        <Box display="flex" justifyContent="space-between" mt={1}>
                            <Skeleton variant="text" width="25%" />
                            <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
                        </Box>
                    </Box>
                ))}
            </Box>
        );
    }

    if (variant === 'detail') {
        return (
            <Box>
                <Skeleton variant="text" width="50%" height={40} />
                <Skeleton variant="text" width="30%" height={28} sx={{ mt: 1 }} />
                <Skeleton variant="rectangular" height={120} sx={{ mt: 2, borderRadius: 1 }} />
                <Box display="flex" gap={2} mt={2}>
                    <Skeleton variant="rectangular" height={48} sx={{ flex: 1, borderRadius: 1 }} />
                    <Skeleton variant="rectangular" height={48} sx={{ flex: 1, borderRadius: 1 }} />
                </Box>
                <Skeleton variant="rectangular" height={48} sx={{ mt: 2, borderRadius: 1 }} />
            </Box>
        );
    }

    // table variant
    return (
        <Box>
            <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1, mb: 1 }} />
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={40} sx={{ mb: 0.5, borderRadius: 0.5 }} />
            ))}
        </Box>
    );
}
