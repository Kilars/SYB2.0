import { useParams } from "react-router";
import { useMatch } from "../../lib/hooks/useMatch";
import { Typography } from "@mui/material";
import MatchDetailsView from "./MatchDetailsView";
import MatchDetailsForm from "./MatchDetailsForm";

export default function MatchDetails() {
    const { leagueId, matchId } = useParams();
    const { match, isMatchLoading } = useMatch(matchId || '');


    if (isMatchLoading) return <Typography>Loading...</Typography>
    if (!match) return <Typography>Match not found...</Typography>
    if (match.completed) return <MatchDetailsView />
    else return <MatchDetailsForm />
}
