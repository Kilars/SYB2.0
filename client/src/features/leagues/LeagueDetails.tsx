import { Box, Button, Chip, Typography } from "@mui/material";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { useNavigate, useParams } from "react-router";
import { Edit, Person } from "@mui/icons-material";
import { useAccount } from "../../lib/hooks/useAccount";
import StatusButton from "./StatusButton";

export default function LeagueDetails() {
    const { id } = useParams();
    const { league, isLeagueLoading } = useLeagues(id);
    const { currentUser } = useAccount();
    const navigate = useNavigate();
    if (isLeagueLoading) return <Typography>Loading...</Typography>
    else if (!league) return <Typography>No leagues found</Typography>
    return (
        <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                Members
            </Typography>

            <Box display="flex" flexWrap="wrap" gap={1}>
                {league.members.map(member => (
                    <Chip
                        key={member.id}
                        icon={<Person />}
                        label={member.displayName}
                        color={member.isAdmin ? 'primary' : 'default'}
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