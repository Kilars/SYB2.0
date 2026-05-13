import { SMASH_COLORS } from "../../theme";

export type RankStyle = {
  bg: string;
  border: string;
  color: string;
  medalEmoji: string;
};

const RANK_STYLES: Record<1 | 2 | 3 | 4, RankStyle> = {
  1: {
    bg: "linear-gradient(135deg, #FFF8E1 0%, #FFD700 100%)",
    border: SMASH_COLORS.gold,
    color: "#5D4E00",
    medalEmoji: "🥇",
  },
  2: {
    bg: "linear-gradient(135deg, #F5F5F5 0%, #C0C0C0 100%)",
    border: SMASH_COLORS.silver,
    color: "#424242",
    medalEmoji: "🥈",
  },
  3: {
    bg: "linear-gradient(135deg, #FBE9E7 0%, #CD7F32 100%)",
    border: SMASH_COLORS.bronze,
    color: "#4E342E",
    medalEmoji: "🥉",
  },
  4: {
    bg: "linear-gradient(135deg, #F3F3F3 0%, #9E9E9E 100%)",
    border: "#9E9E9E",
    color: "#424242",
    medalEmoji: "4️⃣",
  },
};

export function getRankStyle(rank: 1 | 2 | 3 | 4): RankStyle {
  return RANK_STYLES[rank];
}

export function getRankStyleSafe(rank: number): RankStyle | undefined {
  return (RANK_STYLES as Partial<Record<number, RankStyle>>)[rank];
}

const RANK_LABELS: Record<1 | 2 | 3 | 4, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };

export function getRankLabel(rank: 1 | 2 | 3 | 4): string {
  return RANK_LABELS[rank];
}
