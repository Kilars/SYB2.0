import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";

import type { PodiumPlayer, PodiumRank, PodiumRules } from "../../../lib/hooks/usePodiumState";
import { usePodiumState } from "../../../lib/hooks/usePodiumState";
import PodiumPicker from "./PodiumPicker";

export type FfaPlacements = {
  winnerUserId: string | null;
  secondPlaceUserId: string | null;
  thirdPlaceUserId: string | null;
  fourthPlaceUserId: string | null;
};

const EMPTY_PLACEMENTS: FfaPlacements = {
  winnerUserId: null,
  secondPlaceUserId: null,
  thirdPlaceUserId: null,
  fourthPlaceUserId: null,
};

function flatToMap(flat: FfaPlacements): Map<PodiumRank, string | null> {
  const toValue = (v: string | null): string | null => (v === "" || v == null ? null : v);
  return new Map([
    [1, toValue(flat.winnerUserId)],
    [2, toValue(flat.secondPlaceUserId)],
    [3, toValue(flat.thirdPlaceUserId)],
    [4, toValue(flat.fourthPlaceUserId)],
  ]);
}

function mapToFlat(map: Map<PodiumRank, string | null>): FfaPlacements {
  return {
    winnerUserId: map.get(1) ?? null,
    secondPlaceUserId: map.get(2) ?? null,
    thirdPlaceUserId: map.get(3) ?? null,
    fourthPlaceUserId: map.get(4) ?? null,
  };
}

type PodiumPickerFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  playerCount: 2 | 3 | 4;
  /** MUST be a stable reference when content is unchanged — memoize in the parent. */
  players: PodiumPlayer[];
  rules: PodiumRules;
};

export default function PodiumPickerField<T extends FieldValues>({
  control,
  name,
  playerCount,
  players,
  rules,
}: PodiumPickerFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <PodiumPickerControlled
          playerCount={playerCount}
          players={players}
          rules={rules}
          value={(field.value as FfaPlacements | undefined) ?? EMPTY_PLACEMENTS}
          onChange={(next) => field.onChange(next)}
        />
      )}
    />
  );
}

type PodiumPickerControlledProps = {
  playerCount: 2 | 3 | 4;
  players: PodiumPlayer[];
  rules: PodiumRules;
  value: FfaPlacements;
  onChange: (next: FfaPlacements) => void;
};

function PodiumPickerControlled({
  playerCount,
  players,
  rules,
  value,
  onChange,
}: PodiumPickerControlledProps) {
  const mapValue = flatToMap(value);
  const handleMapChange = (next: Map<PodiumRank, string | null>) => onChange(mapToFlat(next));

  const hookReturn = usePodiumState({
    playerCount,
    value: mapValue,
    onChange: handleMapChange,
    rules,
    players,
  });

  return (
    <PodiumPicker
      state={{
        ...hookReturn,
        value: mapValue,
        onChange: handleMapChange,
        rules,
        playerCount,
      }}
      players={players}
    />
  );
}
