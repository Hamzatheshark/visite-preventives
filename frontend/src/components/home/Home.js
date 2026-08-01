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
    Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
    AdminPanelSettings,
    ManageAccounts,
    Build,
    Login,
    PersonAdd,
    EventNote,
    Business,
    TrendingUp,
    ArrowForward,
} from '@mui/icons-material';

const Home = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <Business sx={{ fontSize: 28 }} />,
            title: 'Gestion des Clients',
            description: 'Gérez vos clients, sites et contrats en un seul endroit.',
            color: '#1976d2',
            bgColor: '#e3f2fd',
        },
        {
            icon: <EventNote sx={{ fontSize: 28 }} />,
            title: 'Planification des Visites',
            description: 'Planifiez automatiquement les visites de maintenance préventive.',
            color: '#2e7d32',
            bgColor: '#e8f5e9',
        },
        {
            icon: <TrendingUp sx={{ fontSize: 28 }} />,
            title: 'Suivi & Reporting',
            description: 'Suivez l\'état des visites et générez des rapports.',
            color: '#ed6c02',
            bgColor: '#fff3e0',
        },
    ];

    const roles = [
        {
            icon: <AdminPanelSettings sx={{ fontSize: 24 }} />,
            title: 'Administrateur RMS',
            description: 'Gestion complète de la plateforme',
            color: '#d32f2f',
            bgColor: '#fce4ec',
        },
        {
            icon: <ManageAccounts sx={{ fontSize: 24 }} />,
            title: 'Responsable Software',
            description: 'Planification et gestion des visites',
            color: '#1976d2',
            bgColor: '#e3f2fd',
        },
        {
            icon: <Build sx={{ fontSize: 24 }} />,
            title: 'Technicien Hardware',
            description: 'Consultation des plannings et interventions',
            color: '#2e7d32',
            bgColor: '#e8f5e9',
        },
    ];

    return (
        <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            {/* Hero Section */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                    color: 'white',
                    py: 12,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ textAlign: 'center' }}>
                        {/* Logo - Plus large */}
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 120,
                                height: 120,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.15), rgba(58, 123, 213, 0.15))',
                                border: '3px solid rgba(0, 210, 255, 0.3)',
                                mb: 3,
                                p: 2,
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 0 60px rgba(0, 210, 255, 0.15)',
                            }}
                        >
                            <Typography
                                variant="h3"
                                sx={{
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontSize: { xs: '2rem', md: '2.8rem' },
                                    letterSpacing: '2px',
                                }}
                            >
                                RMS
                            </Typography>
                        </Box>
                        <Typography
                            variant="h2"
                            component="h1"
                            gutterBottom
                            sx={{
                                fontWeight: 700,
                                color: 'white',
                                fontSize: { xs: '2rem', md: '3.5rem' },
                                letterSpacing: '1px',
                            }}
                        >
                            Systèmes de Pointage
                        </Typography>
                        <Typography
                            variant="h6"
                            sx={{
                                color: 'rgba(255,255,255,0.7)',
                                maxWidth: 650,
                                mx: 'auto',
                                mb: 4,
                                fontWeight: 300,
                                lineHeight: 1.8,
                                fontSize: { xs: '1rem', md: '1.1rem' },
                            }}
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
                                    color: '#0f3460',
                                    px: 5,
                                    py: 1.5,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    '&:hover': {
                                        bgcolor: '#f0f0f0',
                                        transform: 'translateY(-2px)',
                                    },
                                    transition: 'all 0.3s ease',
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
                                    borderColor: 'rgba(255,255,255,0.3)',
                                    px: 5,
                                    py: 1.5,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    '&:hover': {
                                        borderColor: 'white',
                                        bgcolor: 'rgba(255,255,255,0.05)',
                                        transform: 'translateY(-2px)',
                                    },
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                S'inscrire
                            </Button>
                        </Box>
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: 6 }}>
                {/* Features Section */}
                <Box sx={{ mb: 8 }}>
                    <Typography
                        variant="h4"
                        component="h2"
                        sx={{
                            textAlign: 'center',
                            fontWeight: 600,
                            color: '#1a1a2e',
                            mb: 1,
                        }}
                    >
                        Fonctionnalités
                    </Typography>
                    <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ textAlign: 'center', mb: 4 }}
                    >
                        Tout ce dont vous avez besoin pour gérer vos visites préventives
                    </Typography>
                    <Grid container spacing={3}>
                        {features.map((feature, index) => (
                            <Grid item xs={12} md={4} key={index}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        borderRadius: 3,
                                        border: '1px solid #e8ecf1',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-6px)',
                                            boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
                                            borderColor: feature.color + '40',
                                        },
                                    }}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        <Box
                                            sx={{
                                                bgcolor: feature.bgColor,
                                                color: feature.color,
                                                width: 48,
                                                height: 48,
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mb: 2,
                                            }}
                                        >
                                            {feature.icon}
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1a1a2e' }}>
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
                </Box>

                {/* Roles Section */}
                <Box sx={{ mb: 8 }}>
                    <Typography
                        variant="h4"
                        component="h2"
                        sx={{
                            textAlign: 'center',
                            fontWeight: 600,
                            color: '#1a1a2e',
                            mb: 1,
                        }}
                    >
                        Les 3 Rôles
                    </Typography>
                    <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ textAlign: 'center', mb: 4 }}
                    >
                        Une plateforme adaptée à chaque utilisateur
                    </Typography>
                    <Grid container spacing={3}>
                        {roles.map((role, index) => (
                            <Grid item xs={12} md={4} key={index}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        textAlign: 'center',
                                        height: '100%',
                                        borderRadius: 3,
                                        border: '1px solid #e8ecf1',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            bgcolor: role.bgColor,
                                            color: role.color,
                                            width: 56,
                                            height: 56,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mx: 'auto',
                                            mb: 2,
                                        }}
                                    >
                                        {role.icon}
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                                        {role.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {role.description}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* CTA Section */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                        color: 'white',
                    }}
                >
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        Prêt à commencer ?
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.8, mb: 3 }}>
                        Créez votre compte dès maintenant et gérez vos visites préventives.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForward />}
                        onClick={() => navigate('/register')}
                        sx={{
                            bgcolor: 'white',
                            color: '#0f3460',
                            px: 5,
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': {
                                bgcolor: '#f0f0f0',
                                transform: 'translateY(-2px)',
                            },
                            transition: 'all 0.3s ease',
                        }}
                    >
                        Commencer maintenant
                    </Button>
                </Paper>
            </Container>

            {/* Footer */}
            <Box
                component="footer"
                sx={{
                    py: 3,
                    textAlign: 'center',
                    bgcolor: 'white',
                    borderTop: '1px solid #e8ecf1',
                }}
            >
                <Container maxWidth="lg">
                    <Typography variant="body2" color="text.secondary">
                        © {new Date().getFullYear()} RMS - Systèmes de Pointage. Tous droits réservés.
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};

export default Home;