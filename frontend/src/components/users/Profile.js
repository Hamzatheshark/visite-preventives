import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Avatar,
    Divider,
    Chip,
    Grid,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { Email, Phone, Person } from '@mui/icons-material';

const Profile = () => {
    const { user } = useAuth();

    if (!user) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6">Veuillez vous connecter</Typography>
            </Box>
        );
    }

    const getRoleLabel = (role) => {
        const roles = {
            'ADMIN': 'Administrateur RMS',
            'RESPONSABLE_SOFTWARE': 'Responsable Software',
            'TECHNICIEN_HARDWARE': 'Technicien Hardware'
        };
        return roles[role] || role;
    };

    const getRoleColor = (role) => {
        const colors = {
            'ADMIN': '#d32f2f',
            'RESPONSABLE_SOFTWARE': '#1976d2',
            'TECHNICIEN_HARDWARE': '#2e7d32'
        };
        return colors[role] || '#666';
    };

    return (
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
            <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Avatar
                        sx={{
                            width: 80,
                            height: 80,
                            mx: 'auto',
                            bgcolor: getRoleColor(user.role),
                            fontSize: 40,
                        }}
                    >
                        {user.prenom?.charAt(0) || 'U'}
                    </Avatar>
                    <Typography variant="h5" sx={{ mt: 2 }}>
                        {user.prenom} {user.nom}
                    </Typography>
                    <Chip
                        label={getRoleLabel(user.role)}
                        sx={{
                            mt: 1,
                            bgcolor: getRoleColor(user.role) + '20',
                            color: getRoleColor(user.role),
                            fontWeight: 'bold',
                        }}
                    />
                </Box>

                <Divider sx={{ my: 3 }} />

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Email sx={{ color: 'text.secondary' }} />
                            <Typography variant="body1">{user.email}</Typography>
                        </Box>
                    </Grid>
                    {user.telephone && (
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Phone sx={{ color: 'text.secondary' }} />
                                <Typography variant="body1">{user.telephone}</Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </Paper>
        </Box>
    );
};

export default Profile;