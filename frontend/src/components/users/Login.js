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
            const response = await api.post('/auth/login', { email, motPasse: password });
            console.log('📥 Réponse login:', response.data);

            if (response.data && response.data.user) {
                const userData = response.data.user;
                console.log('👤 Utilisateur:', userData);
                console.log('🔑 Rôle reçu:', userData.role);

                // Vérifier que le rôle existe
                if (!userData.role) {
                    console.warn('⚠️ Aucun rôle reçu !');
                }

                // Stocker l'utilisateur
                login(userData);

                // Vérifier le stockage
                const stored = localStorage.getItem('user');
                console.log('📦 Stocké dans localStorage:', stored);

                navigate('/dashboard');
            } else {
                setError('Erreur de connexion');
            }
        } catch (error) {
            console.error('❌ Erreur login:', error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError('Email ou mot de passe incorrect');
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

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="textSecondary">
                            💡 Demo: admin@rms.com / admin123
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login;