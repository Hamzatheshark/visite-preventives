// components/users/Login.js - VERSION CORRIGÉE AVEC REDIRECTION PAR RÔLE
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

                // ✅ STOCKER LE TOKEN
                if (token) {
                    localStorage.setItem('token', token);
                    console.log('✅ Token stocké dans localStorage');
                } else {
                    console.warn('⚠️ Aucun token reçu');
                    const tempToken = 'temp-token-' + Date.now();
                    localStorage.setItem('token', tempToken);
                    console.log('✅ Token temporaire créé:', tempToken);
                }

                // ✅ STOCKER L'UTILISATEUR
                if (userData) {
                    localStorage.setItem('user', JSON.stringify(userData));
                    console.log('✅ Utilisateur stocké');
                }

                // ✅ Mettre à jour le contexte
                login(userData);

                // ✅ Vérifier que tout est bien stocké
                const storedToken = localStorage.getItem('token');
                console.log('📦 Vérification - Token stocké:', storedToken ? '✅ Oui' : '❌ Non');

                // ✅ REDIRECTION SELON LE RÔLE
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
        <Container maxWidth="sm">
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f5f7fa',
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        width: '100%',
                        borderRadius: 3,
                        border: '1px solid #e8ecf1',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography
                            variant="h4"
                            component="h1"
                            gutterBottom
                            sx={{
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #0044CC, #00d2ff)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            RMS
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                            Connexion à votre compte
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

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

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="textSecondary">
                            💡 Comptes de test:
                            <br />
                            Admin: hamza@gmail.com
                            <br />
                            Responsable: aya@gmail.com
                            <br />
                            Technicien: hassan@gmail.com
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login;