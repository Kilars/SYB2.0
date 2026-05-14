using Domain;

namespace Application.Common;

public static class PlacementPoints
{
    public static int PointsForParticipant(Match match, IReadOnlyList<Round> rounds, string userId)
    {
        var isParticipant =
            match.PlayerOneUserId == userId ||
            match.PlayerTwoUserId == userId ||
            match.PlayerThreeUserId == userId ||
            match.PlayerFourUserId == userId;

        if (!isParticipant) return 0;

        if (match.PlayerCount == 2)
        {
            int wins = match.WinnerUserId == userId ? 1 : 0;
            // Flawless detection guards on PlayerCount, not round count alone — a stray
            // Round.WinnerUserId on an N>2 match must never award flawless credit.
            bool isFlawless = wins == 1 && rounds.Count(r => r.WinnerUserId != null) == 2;
            return wins * 4 + (isFlawless ? 1 : 0);
        }

        if (match.WinnerUserId == userId) return 4;
        if (match.SecondPlaceUserId == userId) return 2;
        if (match.ThirdPlaceUserId == userId) return 1;
        return 0;
    }
}
