import { Skeleton, Typography } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import MenuItem from "@mui/material/MenuItem";
import { styled } from "@mui/material/styles";
import TextField from "@mui/material/TextField";

import { useCharacters } from "../../lib/hooks/useCharacters";

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

type Props = {
  selectedId?: string;
  onChange: (id?: string) => void;
};

export default function CharacterSelect({ selectedId, onChange }: Props) {
  const { characters, charactersIsLoading } = useCharacters();

  if (charactersIsLoading) return <Skeleton variant="rectangular" width="100%" height={40} />;
  if (!characters)
    return (
      <Typography variant="body2" color="text.secondary">
        No characters found
      </Typography>
    );

  const selectedCharacter = characters.find((char) => char.id === selectedId);

  return (
    <Autocomplete
      options={characters}
      fullWidth
      value={selectedCharacter}
      onChange={(_event, newValue) => onChange(newValue?.id)}
      getOptionLabel={(option) => option.fullName}
      slotProps={{
        listbox: {
          style: {
            paddingTop: 0,
            paddingBottom: 0,
            marginTop: "5px",
          },
        },
      }}
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
      renderOption={(props, item) => (
        <StyledMenuItem {...props} key={item.id} value={item.id}>
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
      )}
    />
  );
}
