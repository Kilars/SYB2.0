import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { styled } from '@mui/material/styles';
import { useCharacters } from '../../lib/hooks/useCharacters';
import { Skeleton, Typography } from '@mui/material';



const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  borderBottom: '1px solid black',
  background: 'white',
  '&.MuiAutocomplete-option:hover': {
    fontWeight: theme.typography.fontWeightBold,
    backgroundColor: theme.palette.grey[300],
    '.non-pop-out-box': {
      visibility: 'hidden',
    },
    '.custom-pop-out-box': {
      display: 'flex',
      transform: 'scale(1.2)',
      transformOrigin: 'left',
      position: 'absolute',
      zIndex: 10,
    },
  },
  '&.MuiAutocomplete-option.MuiAutocomplete-option[aria-selected="true"]': {
    fontWeight: theme.typography.fontWeightBold,
    backgroundColor: theme.palette.grey[300],
  }
}));

const CustomTextField = styled(TextField)(() => ({
  width: '100%',
  '& .MuiOutlinedInput-root': {
    '& fieldset': {  // This targets the notched outline specifically
      border: 'none',
    },
    '&:hover fieldset': {
      border: 'none',
    },
    '&.Mui-focused fieldset': { // This ensures the border stays removed even when focused
      border: 'none',
    },
  },
}));

type Props = {
  selectedId?: string;
  onChange: (id?: string) => void;
}

export default function CharacterSelect({ selectedId, onChange }: Props) {
  const { characters, charactersIsLoading } = useCharacters();

  if (charactersIsLoading) return <Skeleton variant="rectangular" width={200} height={40} />
  if (!characters) return <Typography variant="body2" color="text.secondary">No characters found</Typography>

  const selectedCharacter = characters.find(char => char.id === selectedId);

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
            marginTop: '5px',
          }
        },
      }}
      renderInput={(params) => {
        const optionalCharacterImage = selectedCharacter && (<img src={selectedCharacter.imageUrl} alt={selectedCharacter.shorthandName} width="50" height="50" />)
        return (
          <>
            <CustomTextField
              {...params}
              slotProps={{
                input: {
                  ...params.InputProps, startAdornment: optionalCharacterImage
                }
              }}
              inputProps={{
                ...params.inputProps,
                'aria-label': 'Select character',
              }}
              variant="outlined"
              placeholder="Select character..."
            />
          </>
        )
      }}
      renderOption={(props, item) => (
        <StyledMenuItem
          {...props}
          key={item.id}
          value={item.id}
        >
          <Box className="non-pop-out-box" sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <img src={item.imageUrl} alt={item.fullName} width="50" height="50" />
            {item.fullName}
          </Box>
          <Box className="custom-pop-out-box" sx={{ display: 'none', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <img src={item.imageUrl} alt={item.fullName} width="50" height="50" />
            {item.fullName}
          </Box>
        </StyledMenuItem>
      )}
    />
  );
};