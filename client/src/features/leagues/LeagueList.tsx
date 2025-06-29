import { Box, Button, Card, CardActions, CardContent, Typography } from "@mui/material";
import { useLeagues } from "../../lib/hooks/useLeagues";
import { useNavigate } from "react-router";

export default function LeagueList() {
    const navigate = useNavigate();
    const { leagues, isLeaguesLoading } = useLeagues();
    if (isLeaguesLoading) return <div>Loading ...</div>
    if (!leagues) return <div>No leagues found ...</div>

    return (
        <>
            <Typography variant='h2'>Leagues</Typography>
            {leagues.map(league => (
                <Card component={Box} key={league.id} p={3} m={1}>
                    <CardContent>
                        <Typography variant='h5'>{league.title}</Typography>
                        <Typography variant='body1'>
                            {league.description}
                        </Typography>
                        <Typography variant='caption'>
                            {league.status === 0 && 'Planned'}
                            {league.status === 1 && 'Started'}
                            {league.status === 2 && 'Completed'}
                        </Typography>
                        {league.members.map(member => (<Box key={member.id}>
                            {member.id}
                            <br />
                            {member.displayName}
                        </Box>))}
                    </CardContent>
                    <CardActions>
                        <Button variant="contained" onClick={() => navigate(`/manage/${league.id}`)}>Edit league</Button>
                    </CardActions>
                </Card>
            ))}
        </>
    )
}