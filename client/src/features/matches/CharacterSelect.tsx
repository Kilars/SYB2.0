import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { styled } from '@mui/material/styles';
import { useCharacters } from '../../lib/hooks/useCharacters';
import { Typography } from '@mui/material';



const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  borderBottom: '1px solid black',
  backgroundColor: theme.palette.primary.main,
  '&.MuiAutocomplete-option:hover': {
    fontWeight: theme.typography.fontWeightBold,
    backgroundColor: theme.palette.primary.light,
    '.non-pop-out-box': {
      visibility: 'hidden',
    },
    '.custom-pop-out-box': {
      display: 'flex',
      transform: 'scale(1.4)',
      transformOrigin: 'left',
      position: 'absolute',
      zIndex: 10,
    },
  },
  '&.MuiAutocomplete-option.MuiAutocomplete-option[aria-selected="true"]': {
    fontWeight: theme.typography.fontWeightBold,
    backgroundColor: theme.palette.primary.light,
  }
}));

const CustomTextField = styled(TextField)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  borderRadius: '100%',
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

export default function CharacterSelect() {
  const {characters, charactersIsLoading } = useCharacters();

  const selectedCharacter = characters?.[0];
//  useEffect(() => {
//    if (selectedCharacterId && characters) {
//      const foundCharacter = characters.find((char) => char.id === selectedCharacterId);
//      if (foundCharacter) {
//        setSelectedCharacter(foundCharacter);
//      }
//    }
//  }, [selectedCharacterId, characters]);


  if (charactersIsLoading) return <Typography>Loading characters...</Typography>
  if (!characters) return <Typography>No characters found...</Typography>

  return (
    <Autocomplete
      options={characters}
//      value={selectedCharacter}
//      onChange={(_event, newValue) => onSelectChar(newValue?.id || null)}
      getOptionLabel={(option) => option.fullName}
      ListboxProps={{
        style: {
          paddingTop: 0,
          paddingBottom: 0,
          marginTop: '5px',
        }
      }}
      componentsProps={{
        paper: {
          sx: { backgroundColor: 'transparent', borderRadius: '5%' }
        },
      }}
      renderInput={(params) => {
        const optionalCharacterImage = selectedCharacter && (<img src={selectedCharacter.imageUrl} alt={selectedCharacter.shorthandName} width="50" height="50" />)
        return (
          <>
            <CustomTextField
              {...params}
              InputProps={{ ...params.InputProps, startAdornment: optionalCharacterImage }}
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