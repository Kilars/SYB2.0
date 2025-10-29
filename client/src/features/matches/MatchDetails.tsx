import { useParams } from "react-router";
import { useMatch } from "../../lib/hooks/useMatch";
import { Typography } from "@mui/material";
import MatchDetailsView from "./MatchDetailsView";
import MatchDetailsForm from "./MatchDetailsForm";

export default function MatchDetails() {
    const { leagueId, split, match } = useParams();
    const { match: matchData, isMatchLoading } = useMatch(leagueId || '', parseInt(split || ''), parseInt(match || ''));

    if (isMatchLoading) return <Typography>Loading...</Typography>
    if (!matchData) return <Typography>Match not found...</Typography>
    if (matchData.completed) return <MatchDetailsView />
    else return <MatchDetailsForm />
}
