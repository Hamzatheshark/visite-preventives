// components/users/Login.js - VERSION SANS COMPTES DE TEST
import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Container,
    Alert,
    CircularProgress,
    Link,
    Divider,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Login as LoginIcon, Email, Lock } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('📤 Tentative de login:', email);

            const response = await api.post('/auth/login', {
                email,
                motPasse: password
            });

            console.log('📥 Réponse login:', response.data);

            if (response.data) {
                const token = response.data.token;
                const userData = response.data.user;

                console.log('🔑 Token reçu:', token ? '✅ Oui' : '❌ Non');
                console.log('👤 Utilisateur:', userData);
                console.log('🔑 Rôle:', userData?.role);

                if (token) {
                    localStorage.setItem('token', token);
                    console.log('✅ Token stocké dans localStorage');
                } else {
                    console.warn('⚠️ Aucun token reçu');
                    const tempToken = 'temp-token-' + Date.now();
                    localStorage.setItem('token', tempToken);
                    console.log('✅ Token temporaire créé:', tempToken);
                }

                if (userData) {
                    localStorage.setItem('user', JSON.stringify(userData));
                    console.log('✅ Utilisateur stocké');
                }

                login(userData);

                const storedToken = localStorage.getItem('token');
                console.log('📦 Vérification - Token stocké:', storedToken ? '✅ Oui' : '❌ Non');

                // ✅ Redirection selon le rôle
                const role = userData?.role;
                let redirectPath = '/dashboard';

                if (role === 'ADMIN') {
                    redirectPath = '/dashboard';
                } else if (role === 'RESPONSABLE_SOFTWARE') {
                    redirectPath = '/responsable-upcoming';
                } else if (role === 'TECHNICIEN_HARDWARE' || role === 'TECHNICEN_HARDWARE') {
                    redirectPath = '/technicien-upcoming';
                } else {
                    redirectPath = '/dashboard';
                }

                console.log(`🔀 Redirection vers: ${redirectPath} (rôle: ${role})`);
                navigate(redirectPath);

            } else {
                setError('Erreur de connexion');
            }
        } catch (error) {
            console.error('❌ Erreur login:', error);
            console.error('❌ Détails:', error.response?.data);

            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else if (error.response?.status === 401) {
                setError('Email ou mot de passe incorrect');
            } else if (error.response?.status === 404) {
                setError('Serveur non trouvé - Vérifiez que le backend est démarré');
            } else {
                setError('Erreur de connexion au serveur');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f5f7fa',
                p: 2,
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        border: '1px solid #e8ecf1',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    }}
                >
                    {/* Logo */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography
                            variant="h3"
                            component="h1"
                            sx={{
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #0044CC, #00d2ff)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                mb: 1,
                            }}
                        >
                            RMS
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                            Connexion à votre compte
                        </Typography>
                        <Divider sx={{ mt: 2 }} />
                    </Box>

                    {/* Erreur */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    {/* Formulaire */}
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            margin="normal"
                            required
                            autoFocus
                            disabled={loading}
                            InputProps={{
                                startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                                sx: { borderRadius: 2 }
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Mot de passe"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            required
                            disabled={loading}
                            InputProps={{
                                startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
                                sx: { borderRadius: 2 }
                            }}
                        />
                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            size="large"
                            sx={{
                                mt: 3,
                                py: 1.5,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #0044CC, #0066FF)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #0033AA, #0044CC)',
                                }
                            }}
                            disabled={loading}
                            startIcon={!loading && <LoginIcon />}
                        >
                            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Se connecter'}
                        </Button>
                    </form>

                    {/* Inscription */}
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="textSecondary">
                            Pas encore de compte ?{' '}
                            <Link
                                component={RouterLink}
                                to="/register"
                                sx={{
                                    fontWeight: 600,
                                    color: '#0044CC',
                                    textDecoration: 'none',
                                    '&:hover': {
                                        textDecoration: 'underline',
                                    }
                                }}
                            >
                                S'inscrire
                            </Link>
                        </Typography>
                    </Box>

                    {/* ❌ COMPTES DE TEST SUPPRIMÉS */}
                </Paper>
            </Container>
        </Box>
    );
};

export default Login;