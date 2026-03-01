import { useState } from "react";
import { Box, Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { useNavigate, useParams } from "react-router";
import { Edit, EmojiEvents } from "@mui/icons-material";
import { useAccount } from "../../lib/hooks/useAccount";
import StatusButton from "./StatusButton";
import UserChip from "../../app/shared/components/UserChip";
import LoadingSkeleton from "../../app/shared/components/LoadingSkeleton";
import EmptyState from "../../app/shared/components/EmptyState";
import MergeGuestDialog from "./MergeGuestDialog";

type LeaderboardCardProps = {
    rank: number;
    entry: LeaderboardUser;
};

function LeaderboardCard({ rank, entry }: LeaderboardCardProps) {
    const winRate = (entry.wins + entry.losses) === 0
        ? 0
        : Math.round((entry.wins * 100) / (entry.wins + entry.losses));
    return (
        <Paper elevation={2} sx={{ p: 2, backgroundColor: rank % 2 === 0 ? '#D6E6F6' : '#E5EFF9' }}>
            <Box display="flex" alignItems="center" gap={2}>
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: 'primary.light',
                        border: '2px solid #90b8e0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <Typography variant="body1" fontWeight="bold" lineHeight={1}>
                        {rank}
                    </Typography>
                </Box>
                <Box flex={1} minWidth={0}>
                    <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        {entry.displayName}{entry.isGuest ? ' (guest)' : ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {`W: ${entry.wins} | L: ${entry.losses} | F: ${entry.flawless} | ${winRate}%`}
                    </Typography>
                </Box>
                <Box textAlign="right" flexShrink={0}>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                        {entry.points}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        pts
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
}

export default function Leaderboard() {
    const { leagueId } = useParams();
    const { league, isLeagueLoading, leaderboard, isLeaderboardLoading } = useLeagues(leagueId);
    const { currentUser } = useAccount();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mergeGuest, setMergeGuest] = useState<{ userId: string; displayName: string } | null>(null);
    const isAdmin = currentUser && league?.members.filter(m => m.isAdmin).map(x => x.userId).includes(currentUser.id);
    if (isLeagueLoading || isLeaderboardLoading) return <LoadingSkeleton variant="table" count={5} />
    else if (!league || !leaderboard) return (
        <EmptyState
            icon={<EmojiEvents sx={{ fontSize: 48 }} />}
            message="No leaderboard data yet"
        />
    )
    return (
        <Box>
            {isMobile ? (
                <Stack spacing={1} mb={2}>
                    {leaderboard.map((entry, i) => (
                        <LeaderboardCard key={entry.displayName} rank={i + 1} entry={entry} />
                    ))}
                </Stack>
            ) : (
            <TableContainer sx={{ height: '50vh', overflowX: 'auto' }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow >
                            <TableCell sx={{ backgroundColor: 'primary.light' }}> Player </TableCell>
                            <TableCell sx={{ backgroundColor: 'primary.light' }}> Points </TableCell>
                            <TableCell sx={{ backgroundColor: 'primary.light' }}> WR </TableCell>
                            <TableCell sx={{ backgroundColor: 'primary.light' }}> Wins </TableCell>
                            <TableCell sx={{ backgroundColor: 'primary.light' }}> Losses </TableCell>
                            <TableCell sx={{ backgroundColor: 'primary.light' }}>  Flawless </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {leaderboard.map((leaderboardUser, i) => (
                            <TableRow key={leaderboardUser.displayName} sx={{ backgroundColor: i % 2 == 0 ? '#E5EFF9' : '#D6E6F6', borderBottom: '1px solid #bbb' }}>
                                <TableCell> {leaderboardUser.displayName}{leaderboardUser.isGuest ? ' (guest)' : ''} </TableCell>
                                <TableCell align="center"> {leaderboardUser.points} </TableCell>
                                <TableCell align="center"> {(leaderboardUser.wins + leaderboardUser.losses) === 0 ? 0 : Math.round((leaderboardUser.wins * 100) / (leaderboardUser.wins + leaderboardUser.losses)) + "%"} </TableCell>
                                <TableCell align="center"> {leaderboardUser.wins} </TableCell>
                                <TableCell align="center"> {leaderboardUser.losses} </TableCell>
                                <TableCell align="center"> {leaderboardUser.flawless} </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            )}
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                Members
            </Typography>

            <Box gap={1} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'auto auto auto' } }}>
                {league.members.map(member => (
                    <UserChip
                        key={member.userId}
                        userId={member.userId}
                        displayName={member.displayName}
                        isGuest={member.isGuest}
                        onMerge={isAdmin && member.isGuest ? () => setMergeGuest({ userId: member.userId, displayName: member.displayName }) : undefined}
                    />
                ))}
            </Box>
            <Box display='flex' width='100%' justifyContent='flex-end' pt={2}>
                {currentUser && league.members.filter(m => m.isAdmin).map(x => x.userId).includes(currentUser.id) &&
                    <>
                        {league.status === 0 &&
                            <Button variant="contained" color="secondary" onClick={() => navigate(`/manage/${league.id}`)}>
                                <Edit />
                                <Typography variant="button" ml={1}>
                                    Edit league
                                </Typography>
                            </Button>
                        }
                        <StatusButton leagueId={league.id} leagueStatus={league.status} />
                    </>
                }
            </Box>
            {mergeGuest && (
                <MergeGuestDialog
                    guestUserId={mergeGuest.userId}
                    guestDisplayName={mergeGuest.displayName}
                    open={!!mergeGuest}
                    onClose={() => setMergeGuest(null)}
                />
            )}
        </Box>
    )
}