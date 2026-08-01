// components/users/Profile.js - VERSION CORRIGÉE (SANS ID)
import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Avatar,
    Divider,
    Chip,
    Card,
    CardContent,
    Stack,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import {
    Email,
    Phone,
    Person,
    Badge,
    AdminPanelSettings,
    Engineering,
    SupervisorAccount,
    CheckCircle,
} from '@mui/icons-material';

const Profile = () => {
    const { user } = useAuth();

    if (!user) {
        return (
            <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f7fa', minHeight: '100vh' }}>
                <Paper sx={{ p: 4, borderRadius: 2 }}>
                    <Typography variant="h6" color="text.secondary">
                        Veuillez vous connecter
                    </Typography>
                </Paper>
            </Box>
        );
    }

    const getRoleLabel = (role) => {
        const roles = {
            'ADMIN': 'Administrateur RMS',
            'RESPONSABLE_SOFTWARE': 'Responsable Software',
            'TECHNICIEN_HARDWARE': 'Technicien Hardware',
            'TECHNICEN_HARDWARE': 'Technicien Hardware'
        };
        return roles[role] || role;
    };

    const getRoleColor = (role) => {
        const colors = {
            'ADMIN': '#d32f2f',
            'RESPONSABLE_SOFTWARE': '#1976d2',
            'TECHNICIEN_HARDWARE': '#2e7d32',
            'TECHNICEN_HARDWARE': '#2e7d32'
        };
        return colors[role] || '#666';
    };

    const getRoleIcon = (role) => {
        const icons = {
            'ADMIN': <AdminPanelSettings sx={{ fontSize: 20 }} />,
            'RESPONSABLE_SOFTWARE': <SupervisorAccount sx={{ fontSize: 20 }} />,
            'TECHNICIEN_HARDWARE': <Engineering sx={{ fontSize: 20 }} />,
            'TECHNICEN_HARDWARE': <Engineering sx={{ fontSize: 20 }} />
        };
        return icons[role] || <Person sx={{ fontSize: 20 }} />;
    };

    const getInitials = () => {
        const prenom = user.prenom || '';
        const nom = user.nom || '';
        return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase() || 'U';
    };

    const getFullName = () => {
        const prenom = user.prenom || '';
        const nom = user.nom || '';
        return `${prenom.toUpperCase()} ${nom.toUpperCase()}`.trim();
    };

    const InfoCard = ({ icon, label, value }) => (
        <Card sx={{ borderRadius: 2, border: '1px solid #e8ecf1', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#f0f0f0', width: 36, height: 36 }}>
                    {icon}
                </Avatar>
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a1a2e' }}>
                        {value || 'Non renseigné'}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                {/* Header */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 2,
                        bgcolor: 'white',
                        border: '1px solid #e8ecf1',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                    }}
                >
                    <Avatar
                        sx={{
                            width: 64,
                            height: 64,
                            bgcolor: getRoleColor(user.role),
                            fontSize: 28,
                            fontWeight: 600,
                            border: '3px solid #e8ecf1',
                        }}
                    >
                        {getInitials()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                            {getFullName()}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            {getRoleIcon(user.role)}
                            <Chip
                                label={getRoleLabel(user.role)}
                                size="small"
                                sx={{
                                    bgcolor: getRoleColor(user.role) + '15',
                                    color: getRoleColor(user.role),
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    height: 26,
                                }}
                            />
                            <Chip
                                label="Actif"
                                size="small"
                                icon={<CheckCircle sx={{ fontSize: 14 }} />}
                                sx={{
                                    bgcolor: '#e8f5e9',
                                    color: '#2e7d32',
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    height: 26,
                                }}
                            />
                        </Box>
                    </Box>
                </Paper>

                {/* Informations */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: 2,
                        bgcolor: 'white',
                        border: '1px solid #e8ecf1',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a1a2e', mb: 2 }}>
                        Informations personnelles
                    </Typography>

                    <Stack spacing={1.5}>
                        <InfoCard
                            icon={<Person sx={{ color: '#1976d2' }} />}
                            label="Nom complet"
                            value={getFullName()}
                        />
                        <InfoCard
                            icon={<Email sx={{ color: '#1976d2' }} />}
                            label="Email"
                            value={user.email}
                        />
                        {user.telephone && (
                            <InfoCard
                                icon={<Phone sx={{ color: '#1976d2' }} />}
                                label="Téléphone"
                                value={user.telephone}
                            />
                        )}
                        <InfoCard
                            icon={<Badge sx={{ color: '#1976d2' }} />}
                            label="Rôle"
                            value={getRoleLabel(user.role)}
                        />
                        {/* ❌ ID Utilisateur SUPPRIMÉ */}
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{
                        p: 1.5,
                        bgcolor: '#f8f9fa',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}>
                        <CheckCircle sx={{ color: '#2e7d32', fontSize: 16 }} />
                        <Typography variant="caption" color="text.secondary">
                            Compte actif
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                            Membre RMS
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};

export default Profile;