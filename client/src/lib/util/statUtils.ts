export function computeCharacterWinRates(
  matches: Match[],
  characters: Character[],
): CharacterWinRate[] {
  const winsDict: Record<string, [wins: number, total: number]> = {};
  for (const match of matches) {
    const p1 = match.playerOne?.userId;
    for (const round of match.rounds) {
      if (!round.completed) continue;
      const char1 = round.playerOneCharacterId;
      const char2 = round.playerTwoCharacterId;
      if (!char1 || !char2) continue;
      if (!winsDict[char1]) winsDict[char1] = [0, 0];
      if (!winsDict[char2]) winsDict[char2] = [0, 0];
      winsDict[char1][1] += 1;
      winsDict[char2][1] += 1;

      if (p1 === round.winnerUserId) winsDict[char1][0] += 1;
      else winsDict[char2][0] += 1;
    }
  }

  return Object.entries(winsDict).map(([charId, [wins, total]]) => {
    const char = characters.find((c) => c.id === charId);
    return {
      characterId: charId,
      name: char?.shorthandName || "Unknown",
      imageUrl: char?.imageUrl || "",
      winRate: Math.round((wins / total) * 100),
      wins,
      total,
    };
  });
}

export function computePlayerWinRates(
  matches: Match[],
  players: { userId: string; displayName: string }[],
): PlayerWinRate[] {
  const stats: Record<string, { wins: number; losses: number }> = {};

  for (const player of players) {
    stats[player.userId] = { wins: 0, losses: 0 };
  }

  for (const match of matches) {
    if (!match.completed || !match.winnerUserId) continue;

    const n = match.playerCount ?? 2;

    if (n === 2) {
      // N=2: standard 1v1 win/loss
      const p1 = match.playerOne?.userId;
      const p2 = match.playerTwo?.userId;
      if (!p1 || !p2) continue;

      if (!stats[p1]) stats[p1] = { wins: 0, losses: 0 };
      if (!stats[p2]) stats[p2] = { wins: 0, losses: 0 };

      if (match.winnerUserId === p1) {
        stats[p1].wins += 1;
        stats[p2].losses += 1;
      } else {
        stats[p2].wins += 1;
        stats[p1].losses += 1;
      }
    } else {
      // N>2 FFA: winner gets a win, all others get a loss
      const allParticipants = [
        match.playerOne?.userId,
        match.playerTwo?.userId,
        match.playerThree?.userId,
        match.playerFour?.userId,
      ].filter((id): id is string => !!id);

      for (const userId of allParticipants) {
        if (!stats[userId]) stats[userId] = { wins: 0, losses: 0 };
        if (userId === match.winnerUserId) {
          stats[userId].wins += 1;
        } else {
          stats[userId].losses += 1;
        }
      }
    }
  }

  return Object.entries(stats).map(([userId, s]) => {
    const player = players.find((p) => p.userId === userId);
    const total = s.wins + s.losses;
    return {
      userId,
      displayName: player?.displayName || "Unknown",
      winRate: total === 0 ? 0 : Math.round((s.wins * 100) / total),
      wins: s.wins,
      losses: s.losses,
    };
  });
}
