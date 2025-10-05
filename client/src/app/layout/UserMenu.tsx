import { Box, Button, Typography } from '@mui/material';
import { Link } from 'react-router';
import { Add, } from '@mui/icons-material';

export default function UserMenu() {
    return (
        <Box component={Link} to='/createLeague' sx={{textDecoration: 'none'}}>
            <Typography sx={{fontSize: '1.2rem', lineHeight: 1.5}} fontWeight='bold' component={Button} color='white' fontSize='medium'>Create League
                <Add />
            </Typography>
        </Box>
    );
}
