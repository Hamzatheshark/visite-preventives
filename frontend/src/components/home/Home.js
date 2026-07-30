// frontend/src/components/home/Home.js
import React from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    Paper,
    useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
    AdminPanelSettings,
    ManageAccounts,
    Build,
    Login,
    PersonAdd,
    Security,
    EventNote,
    Business,
} from '@mui/icons-material';

const Home = () => {
    const navigate = useNavigate();
    const theme = useTheme();

    const features = [
        {
            icon: <Business sx={{ fontSize: 40, color: '#1976d2' }} />,
            title: 'Gestion des Clients',
            description: 'Gérez vos clients, sites et contrats en un seul endroit.'
        },
        {
            icon: <EventNote sx={{ fontSize: 40, color: '#2e7d32' }} />,
            title: 'Planification des Visites',
            description: 'Planifiez automatiquement les visites de maintenance préventive.'
        },
        {
            icon: <Security sx={{ fontSize: 40, color: '#d32f2f' }} />,
            title: 'Sécurisé',
            description: 'Authentification forte avec gestion des rôles et permissions.'
        },
    ];

    const roles = [
        {
            icon: <AdminPanelSettings sx={{ fontSize: 30, color: '#d32f2f' }} />,
            title: 'Administrateur RMS',
            description: 'Gestion complète de la plateforme'
        },
        {
            icon: <ManageAccounts sx={{ fontSize: 30, color: '#1976d2' }} />,
            title: 'Responsable Software',
            description: 'Planification et gestion des visites'
        },
        {
            icon: <Build sx={{ fontSize: 30, color: '#2e7d32' }} />,
            title: 'Technicien Hardware',
            description: 'Consultation des plannings et interventions'
        },
    ];

    return (
        <Box>
            {/* Hero Section */}
            <Box
                sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    py: 10,
                    mb: 6,
                    borderRadius: '0 0 50% 50% / 0 0 10% 10%',
                }}
            >
                <Container maxWidth="lg">
                    <Typography
                        variant="h2"
                        component="h1"
                        gutterBottom
                        sx={{ fontWeight: 'bold', textAlign: 'center' }}
                    >
                        RMS
                    </Typography>
                    <Typography
                        variant="h5"
                        gutterBottom
                        sx={{ textAlign: 'center', opacity: 0.9 }}
                    >
                        Plateforme de Gestion des Visites Préventives
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{ textAlign: 'center', opacity: 0.8, maxWidth: 600, mx: 'auto', mb: 4 }}
                    >
                        Automatisez le cycle complet de planification des visites
                        de maintenance préventive pour vos clients.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<Login />}
                            onClick={() => navigate('/login')}
                            sx={{
                                bgcolor: 'white',
                                color: 'primary.main',
                                '&:hover': { bgcolor: '#f5f5f5' }
                            }}
                        >
                            Se connecter
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<PersonAdd />}
                            onClick={() => navigate('/register')}
                            sx={{
                                color: 'white',
                                borderColor: 'white',
                                '&:hover': { borderColor: '#f5f5f5', bgcolor: 'rgba(255,255,255,0.1)' }
                            }}
                        >
                            S'inscrire
                        </Button>
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg">
                {/* Features Section */}
                <Typography
                    variant="h4"
                    component="h2"
                    gutterBottom
                    sx={{ textAlign: 'center', mb: 4 }}
                >
                    Fonctionnalités
                </Typography>
                <Grid container spacing={4} sx={{ mb: 6 }}>
                    {features.map((feature, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    p: 2,
                                    transition: 'transform 0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: 6,
                                    }
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                                    <Typography variant="h6" component="h3" gutterBottom>
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {feature.description}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Roles Section */}
                <Typography
                    variant="h4"
                    component="h2"
                    gutterBottom
                    sx={{ textAlign: 'center', mb: 4 }}
                >
                    Les 3 Rôles
                </Typography>
                <Grid container spacing={3} sx={{ mb: 6 }}>
                    {roles.map((role, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <Paper
                                elevation={2}
                                sx={{
                                    p: 3,
                                    textAlign: 'center',
                                    height: '100%',
                                    transition: 'transform 0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4,
                                    }
                                }}
                            >
                                <Box sx={{ mb: 2 }}>{role.icon}</Box>
                                <Typography variant="h6" gutterBottom>
                                    {role.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {role.description}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* CTA Section */}
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        bgcolor: '#f5f5f5',
                        borderRadius: 3,
                        mb: 4,
                    }}
                >
                    <Typography variant="h5" gutterBottom>
                        Prêt à commencer ?
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Créez votre compte dès maintenant et gérez vos visites préventives.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<PersonAdd />}
                        onClick={() => navigate('/register')}
                    >
                        Créer un compte
                    </Button>
                </Paper>
            </Container>

            {/* Footer */}
            <Box
                component="footer"
                sx={{
                    py: 3,
                    textAlign: 'center',
                    bgcolor: 'grey.100',
                    mt: 4,
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    © {new Date().getFullYear()} RMS - Tous droits réservés
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Document confidentiel - Version 1.1
                </Typography>
            </Box>
        </Box>
    );
};

export default Home;