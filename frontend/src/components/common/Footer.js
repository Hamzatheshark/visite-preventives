// components/common/Footer.js
import React from 'react';
import { Box, Typography, Link } from '@mui/material';

const Footer = () => {
    return (
        <Box
            component="footer"
            sx={{
                py: 2,
                px: 2,
                mt: 'auto',
                backgroundColor: (theme) => theme.palette.grey[100],
                textAlign: 'center',
            }}
        >
            <Typography variant="body2" color="text.secondary">
                © {new Date().getFullYear()} RMS - Tous droits réservés
            </Typography>
            <Typography variant="caption" color="text.secondary">
                Document confidentiel - Version 1.1
            </Typography>
        </Box>
    );
};

export default Footer;