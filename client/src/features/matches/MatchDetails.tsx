import { Link as RouterLink, useParams } from "react-router";
import { useMatch } from "../../lib/hooks/useMatch";
import { useLeagues } from "../../lib/hooks/useLeagues";
import MatchDetailsView from "./MatchDetailsView";
import MatchDetailsForm from "./MatchDetailsForm";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import EmptyState from "../../app/shared/components/EmptyState";
import AppBreadcrumbs from "../../app/shared/components/AppBreadcrumbs";
import { ArrowBack, SportsEsports } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";

export default function MatchDetails() {
    const { leagueId, split, match } = useParams();
    const { match: matchData, isMatchLoading } = useMatch(leagueId || '', parseInt(split || ''), parseInt(match || ''));
    const { league } = useLeagues(leagueId);

    if (isMatchLoading) return <LoadingSkeleton variant="detail" />
    if (!matchData) return (
        <EmptyState
            icon={<SportsEsports sx={{ fontSize: 48 }} />}
            message="Match not found"
        />
    )

    const breadcrumbItems = [
        { label: 'Leagues', href: '/leagues' },
        { label: league?.title ?? '...', href: `/leagues/${leagueId}/leaderboard` },
        { label: `Match #${match}` },
    ];

    return (
        <Box>
            <AppBreadcrumbs items={breadcrumbItems} />
            <Box display="flex" alignItems="center" gap={1} mb={1}>
                <IconButton
                    component={RouterLink}
                    to={`/leagues/${leagueId}/matches`}
                    aria-label="Back to matches"
                    size="small"
                >
                    <ArrowBack />
                </IconButton>
                <Typography
                    component={RouterLink}
                    to={`/leagues/${leagueId}/matches`}
                    variant="body2"
                    color="text.secondary"
                    sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                    Back to matches
                </Typography>
            </Box>
            {matchData.completed ? <MatchDetailsView /> : <MatchDetailsForm />}
        </Box>
    );
}
