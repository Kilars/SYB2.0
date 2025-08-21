import { Box, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { useNavigate, useParams } from "react-router";
import { Edit, Person } from "@mui/icons-material";
import { useAccount } from "../../lib/hooks/useAccount";
import StatusButton from "./StatusButton";

export default function Leaderboard() {
    const { id } = useParams();
    const { league, isLeagueLoading, leaderboard, isLeaderboardLoading } = useLeagues(id);
    const { currentUser } = useAccount();
    const navigate = useNavigate();
    if (isLeagueLoading || isLeaderboardLoading) return <Typography>Loading...</Typography>
    else if (!league || !leaderboard) return <Typography>No league found</Typography>
    return (
        <Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell> Rank </TableCell>
                            <TableCell> Player </TableCell>
                            <TableCell> Points </TableCell>
                            <TableCell> Win rate </TableCell>
                            <TableCell> Wins </TableCell>
                            <TableCell> Losses </TableCell>
                            <TableCell> Flawless </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {leaderboard.map((leaderboardUser, i) => (
                            <TableRow key={leaderboardUser.displayName}>
                                <TableCell> {(i + 1) + "."} </TableCell>
                                <TableCell> {leaderboardUser.displayName} </TableCell>
                                <TableCell> {leaderboardUser.points} </TableCell>
                                <TableCell> {Math.round((leaderboardUser.wins * 100) / (leaderboardUser.wins + leaderboardUser.losses)) + "%"} </TableCell>
                                <TableCell> {leaderboardUser.wins} </TableCell>
                                <TableCell> {leaderboardUser.losses} </TableCell>
                                <TableCell> {leaderboardUser.flawless} </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                Members
            </Typography>

            <Box gap={1} sx={{display: 'grid', 'grid-template-columns': 'repeat(auto-fill, 100px)'}}>
                {league.members.map(member => (
                    <Chip
                        key={member.id}
                        icon={<Person />}
                        label={member.displayName}
                        color={member.isAdmin ? 'primary' : 'default'}
                        sx={{width: '100px'}}
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
        </Box>
    )
}