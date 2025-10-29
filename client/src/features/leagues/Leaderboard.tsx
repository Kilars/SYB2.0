import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { useNavigate, useParams } from "react-router";
import { Edit } from "@mui/icons-material";
import { useAccount } from "../../lib/hooks/useAccount";
import StatusButton from "./StatusButton";
import UserChip from "../../app/shared/components/UserChip";

export default function Leaderboard() {
    const { leagueId } = useParams();
    const { league, isLeagueLoading, leaderboard, isLeaderboardLoading } = useLeagues(leagueId);
    const { currentUser } = useAccount();
    const navigate = useNavigate();
    if (isLeagueLoading || isLeaderboardLoading) return <Typography>Loading...</Typography>
    else if (!league || !leaderboard) return <Typography>No league found</Typography>
    return (
        <Box>
            <TableContainer sx={{height: '50vh'}}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow >
                            <TableCell sx={{backgroundColor: '#C0DEFA'}}> Player </TableCell>
                            <TableCell sx={{backgroundColor: '#C0DEFA'}}> Points </TableCell>
                            <TableCell sx={{backgroundColor: '#C0DEFA'}}> WR </TableCell>
                            <TableCell sx={{backgroundColor: '#C0DEFA'}}> Wins </TableCell>
                            <TableCell sx={{backgroundColor: '#C0DEFA'}}> Losses </TableCell>
                            <TableCell sx={{backgroundColor: '#C0DEFA'}}>  Flawless </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {leaderboard.map((leaderboardUser, i) => (
                            <TableRow key={leaderboardUser.displayName} sx={{ backgroundColor: i % 2 == 0 ? '#E5EFF9' : '#D6E6F6' }}>
                                <TableCell> {leaderboardUser.displayName} </TableCell>
                                <TableCell align="center"> {leaderboardUser.points} </TableCell>
                                <TableCell align="center"> {Math.round((leaderboardUser.wins * 100) / (leaderboardUser.wins + leaderboardUser.losses)) + "%"} </TableCell>
                                <TableCell align="center"> {leaderboardUser.wins} </TableCell>
                                <TableCell align="center"> {leaderboardUser.losses} </TableCell>
                                <TableCell align="center"> {leaderboardUser.flawless} </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                Members
            </Typography>

            <Box gap={1} sx={{display: 'grid', 'grid-template-columns': 'auto auto auto'}}>
                {league.members.map(member => (
                    <UserChip key={member.userId} userId={member.userId} displayName={member.displayName} />
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
        </Box>
    )
}