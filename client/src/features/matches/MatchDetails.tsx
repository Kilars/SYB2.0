import { useParams } from "react-router";

export default function MatchDetails() {
    const { id } = useParams();
  return (
    <div>MatchDetails for match {id} </div>
  )
}
