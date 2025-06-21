import { Box, Card, CardActions, CardContent, Typography } from "@mui/material";
import { useLeagues } from "../../lib/hooks/useLeagues";

export default function LeagueList() {
    const { leagues, isLeaguesLoading } = useLeagues();
    if (isLeaguesLoading) return <div>Loading ...</div>
    if (!leagues) return <div>No leagues found ...</div>

    return (
        <>
            <Typography variant='h2'>Leaderboards</Typography>
            {leagues.map(league => (
                <Card component={Box} key={league.id} p={3} m={1}>
                    <CardContent>
                        <Typography variant='h5'>{league.title}</Typography>
                        <Typography variant='body1'>
                            {league.description}
                        </Typography>
                    </CardContent>
                    <CardActions>
                        <Typography variant='caption'>
                            {league.status}
                        </Typography>
                    </CardActions>
                </Card>
            ))}
        </>
    )
}