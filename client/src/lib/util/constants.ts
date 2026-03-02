import { SMASH_COLORS } from "../../app/theme";

export const COMPETITION_STATUSES = [
  ["Planned", "warning"],
  ["Active", "success"],
  ["Complete", "info"],
] as const;

export const STATUS_BORDERS = [SMASH_COLORS.p3Yellow, SMASH_COLORS.p4Green, SMASH_COLORS.p2Blue];
