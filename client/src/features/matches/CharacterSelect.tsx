import { Divider, ListSubheader, Skeleton, Typography } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import MenuItem from "@mui/material/MenuItem";
import { styled } from "@mui/material/styles";
import TextField from "@mui/material/TextField";

import { useCharacters } from "../../lib/hooks/useCharacters";
import { useTopCharacters } from "../../lib/hooks/useTopCharacters";

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  background: theme.palette.background.paper,
  padding: theme.spacing(1),
  gap: theme.spacing(1.5),
  "&.MuiAutocomplete-option:hover": {
    fontWeight: theme.typography.fontWeightBold,
    backgroundColor: theme.palette.action.hover,
  },
  '&.MuiAutocomplete-option.MuiAutocomplete-option[aria-selected="true"]': {
    fontWeight: theme.typography.fontWeightBold,
    backgroundColor: theme.palette.action.selected,
  },
}));

const CustomTextField = styled(TextField)(({ theme }) => ({
  width: "100%",
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      border: "none",
    },
    "&:hover fieldset": {
      border: "none",
    },
    "&.Mui-focused fieldset": {
      border: `2px solid ${theme.palette.primary.main}`,
      borderRadius: 4,
    },
  },
}));

type GroupedCharacter = Character & { group: string };

type Props = {
  selectedId?: string;
  onChange: (id?: string) => void;
  userId?: string;
  disabledIds?: string[];
};

export default function CharacterSelect({ selectedId, onChange, userId, disabledIds = [] }: Props) {
  const { characters, charactersIsLoading } = useCharacters();
  const { topCharacterIds } = useTopCharacters(userId);

  if (charactersIsLoading) return <Skeleton variant="rectangular" width="100%" height={40} />;
  if (!characters)
    return (
      <Typography variant="body2" color="text.secondary">
        No characters found
      </Typography>
    );

  const hasTopPicks = topCharacterIds.length > 0;

  let options: GroupedCharacter[];
  if (hasTopPicks) {
    const topPickSet = new Set(topCharacterIds);
    const topPicks: GroupedCharacter[] = topCharacterIds
      .map((id) => characters.find((c) => c.id === id))
      .filter((c): c is Character => c !== undefined)
      .map((c) => ({ ...c, group: "Most likely picks" }));

    const remaining: GroupedCharacter[] = characters
      .filter((c) => !topPickSet.has(c.id))
      .sort((a, b) => a.fullName.localeCompare(b.fullName) || a.id.localeCompare(b.id))
      .map((c) => ({ ...c, group: "All characters" }));

    options = [...topPicks, ...remaining];
  } else {
    options = characters
      .slice()
      .sort((a, b) => a.fullName.localeCompare(b.fullName) || a.id.localeCompare(b.id))
      .map((c) => ({ ...c, group: "" }));
  }

  const selectedCharacter = options.find((c) => c.id === selectedId);

  // Filter out the currently-selected character so it's never disabled in its own slot
  const effectiveDisabledIds = disabledIds.filter((id) => id !== selectedId);

  const isOptionDisabled = (option: GroupedCharacter) => effectiveDisabledIds.includes(option.id);

  return (
    <Autocomplete
      options={options}
      fullWidth
      value={selectedCharacter ?? null}
      onChange={(_event, newValue) => onChange(newValue?.id)}
      getOptionLabel={(option) => option.fullName}
      groupBy={hasTopPicks ? (option) => option.group : undefined}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      getOptionDisabled={isOptionDisabled}
      slotProps={{
        listbox: {
          style: {
            paddingTop: 0,
            paddingBottom: 0,
            marginTop: "5px",
          },
        },
      }}
      renderGroup={(params) => (
        <li key={params.key}>
          <ListSubheader
            component="div"
            sx={(theme) => ({
              background: theme.palette.background.paper,
              borderLeft: `3px solid ${theme.palette.primary.main}`,
              color: theme.palette.primary.main,
              fontWeight: theme.typography.fontWeightBold,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              lineHeight: "2rem",
              position: "sticky",
              top: 0,
              zIndex: 1,
            })}
          >
            {params.group}
          </ListSubheader>
          <ul style={{ padding: 0 }}>{params.children}</ul>
          {params.group === "Most likely picks" && <Divider />}
        </li>
      )}
      renderInput={(params) => {
        const optionalCharacterImage = selectedCharacter && (
          <img
            src={selectedCharacter.imageUrl}
            alt={selectedCharacter.shorthandName}
            style={{ width: "clamp(32px, 8vw, 50px)", height: "clamp(32px, 8vw, 50px)" }}
          />
        );
        return (
          <CustomTextField
            {...params}
            slotProps={{
              input: {
                ...params.InputProps,
                startAdornment: optionalCharacterImage,
              },
            }}
            inputProps={{
              ...params.inputProps,
              "aria-label": "Select character",
            }}
            variant="outlined"
            placeholder="Select character..."
          />
        );
      }}
      renderOption={(props, item) => {
        const disabled = isOptionDisabled(item);
        return (
          <StyledMenuItem
            {...props}
            key={`${item.group}-${item.id}`}
            value={item.id}
            aria-disabled={disabled}
            title={disabled ? "Already used in an earlier round" : undefined}
            sx={disabled ? { opacity: 0.4 } : undefined}
          >
            <img
              src={item.imageUrl}
              alt={item.fullName}
              width="44"
              height="44"
              style={{ borderRadius: 4 }}
            />
            <Typography variant="body2" fontWeight="inherit">
              {item.fullName}
            </Typography>
          </StyledMenuItem>
        );
      }}
    />
  );
}
