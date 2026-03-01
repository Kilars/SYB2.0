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
import { SMASH_COLORS } from "../../app/theme";

const RANK_STYLES: Record<number, { bg: string; border: string; color: string; icon: string }> = {
    1: { bg: 'linear-gradient(135deg, #FFF8E1 0%, #FFD700 100%)', border: SMASH_COLORS.gold, color: '#5D4E00', icon: '🥇' },
    2: { bg: 'linear-gradient(135deg, #F5F5F5 0%, #C0C0C0 100%)', border: SMASH_COLORS.silver, color: '#424242', icon: '🥈' },
    3: { bg: 'linear-gradient(135deg, #FBE9E7 0%, #CD7F32 100%)', border: SMASH_COLORS.bronze, color: '#4E342E', icon: '🥉' },
};

type LeaderboardCardProps = {
    rank: number;
    entry: LeaderboardUser;
};

function LeaderboardCard({ rank, entry }: LeaderboardCardProps) {
    const winRate = (entry.wins + entry.losses) === 0
        ? 0
        : Math.round((entry.wins * 100) / (entry.wins + entry.losses));
    const rankStyle = RANK_STYLES[rank];
    return (
        <Paper
            elevation={rankStyle ? 4 : 2}
            sx={{
                p: 2,
                backgroundImage: rankStyle?.bg,
                backgroundColor: rankStyle ? undefined : (rank % 2 === 0 ? '#E8EAF6' : '#E3F2FD'),
                border: rankStyle ? `2px solid ${rankStyle.border}` : 'none',
            }}
        >
            <Box display="flex" alignItems="center" gap={2}>
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: rankStyle
                            ? `linear-gradient(135deg, ${rankStyle.border}, ${rankStyle.color})`
                            : 'linear-gradient(135deg, #0f3460, #1E88E5)',
                        border: `2px solid ${rankStyle?.border || '#1E88E5'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: rankStyle ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                    }}
                >
                    <Typography variant="body1" fontWeight="bold" lineHeight={1} color="white">
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
                    <Typography variant="h5" fontWeight="bold" sx={{ color: rankStyle ? rankStyle.color : 'primary.main' }}>
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

function RankBadge({ rank }: { rank: number }) {
    const rankStyle = RANK_STYLES[rank];
    if (!rankStyle) {
        return (
            <Box sx={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0f3460, #1E88E5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Typography variant="body2" fontWeight="bold" color="white">{rank}</Typography>
            </Box>
        );
    }
    return (
        <Box sx={{
            width: 36, height: 36, borderRadius: '50%',
            background: rankStyle.bg,
            border: `2px solid ${rankStyle.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        }}>
            <Typography variant="body2" fontWeight="bold" sx={{ color: rankStyle.color }}>{rank}</Typography>
        </Box>
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
                        <TableRow>
                            <TableCell sx={{ backgroundColor: '#0f3460', color: 'white', fontWeight: 'bold' }}> # </TableCell>
                            <TableCell sx={{ backgroundColor: '#0f3460', color: 'white', fontWeight: 'bold' }}> Player </TableCell>
                            <TableCell sx={{ backgroundColor: '#0f3460', color: 'white', fontWeight: 'bold' }} align="center"> Points </TableCell>
                            <TableCell sx={{ backgroundColor: '#0f3460', color: 'white', fontWeight: 'bold' }} align="center"> WR </TableCell>
                            <TableCell sx={{ backgroundColor: '#0f3460', color: 'white', fontWeight: 'bold' }} align="center"> Wins </TableCell>
                            <TableCell sx={{ backgroundColor: '#0f3460', color: 'white', fontWeight: 'bold' }} align="center"> Losses </TableCell>
                            <TableCell sx={{ backgroundColor: '#0f3460', color: 'white', fontWeight: 'bold' }} align="center"> Flawless </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {leaderboard.map((leaderboardUser, i) => {
                            const rank = i + 1;
                            const rankStyle = RANK_STYLES[rank];
                            const rowBg = rankStyle
                                ? rankStyle.bg
                                : (i % 2 === 0 ? '#E8EAF6' : '#E3F2FD');
                            return (
                                <TableRow
                                    key={leaderboardUser.displayName}
                                    sx={{
                                        backgroundImage: rankStyle ? rowBg : 'none',
                                        backgroundColor: rankStyle ? undefined : rowBg,
                                        borderBottom: '1px solid #bbb',
                                        ...(rankStyle && {
                                            borderLeft: `4px solid ${rankStyle.border}`,
                                        }),
                                    }}
                                >
                                    <TableCell sx={{ width: 50 }}>
                                        <RankBadge rank={rank} />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: rankStyle ? 'bold' : 'normal' }}>
                                        {leaderboardUser.displayName}{leaderboardUser.isGuest ? ' (guest)' : ''}
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: rankStyle ? '1.1rem' : 'inherit' }}>
                                        {leaderboardUser.points}
                                    </TableCell>
                                    <TableCell align="center">
                                        {(leaderboardUser.wins + leaderboardUser.losses) === 0 ? 0 : Math.round((leaderboardUser.wins * 100) / (leaderboardUser.wins + leaderboardUser.losses)) + "%"}
                                    </TableCell>
                                    <TableCell align="center" sx={{ color: '#43A047', fontWeight: 600 }}>
                                        {leaderboardUser.wins}
                                    </TableCell>
                                    <TableCell align="center" sx={{ color: '#E53935', fontWeight: 600 }}>
                                        {leaderboardUser.losses}
                                    </TableCell>
                                    <TableCell align="center" sx={{ color: '#1E88E5', fontWeight: 600 }}>
                                        {leaderboardUser.flawless}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
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
