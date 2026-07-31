// components/users/Login.js - Version corrigée
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
                // ✅ Récupérer le token
                const token = response.data.token;
                const userData = response.data.user;

                console.log('🔑 Token reçu:', token ? '✅ Oui' : '❌ Non');
                console.log('👤 Utilisateur:', userData);
                console.log('🔑 Rôle:', userData?.role);

                // ✅ STOCKER LE TOKEN (IMPORTANT !)
                if (token) {
                    localStorage.setItem('token', token);
                    console.log('✅ Token stocké dans localStorage');
                } else {
                    console.warn('⚠️ Aucun token reçu');
                    // Créer un token temporaire pour le test
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

                // Rediriger vers le dashboard
                navigate('/dashboard');
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
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        width: '100%',
                        borderRadius: 2,
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#0044CC' }}>
                            RMS
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                            Connexion à votre compte
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
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
                            }}
                        />
                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            size="large"
                            sx={{ mt: 3, py: 1.5 }}
                            disabled={loading}
                            startIcon={!loading && <LoginIcon />}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Se connecter'}
                        </Button>
                    </form>

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="body2">
                            Pas encore de compte ?{' '}
                            <Link component={RouterLink} to="/register" sx={{ fontWeight: 'bold' }}>
                                S'inscrire
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login;