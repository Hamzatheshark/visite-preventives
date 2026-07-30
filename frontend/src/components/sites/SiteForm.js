import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const SiteForm = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>Ajouter un site</Typography>
                <Typography variant="body1" color="text.secondary">
                    Utilisez la page "Gestion des sites" pour ajouter un site.
                </Typography>
            </Paper>
        </Box>
    );
};

export default SiteForm;