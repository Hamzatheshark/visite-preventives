// frontend/src/components/users/Register.js
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
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    PersonAdd,
    Email,
    Lock,
    Phone,
    Person,
    AdminPanelSettings,
    ManageAccounts,
    Build
} from '@mui/icons-material';
import api from '../../api/axiosConfig';

const Register = () => {
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        motPasse: '',
        confirmPassword: '',
        telephone: '',
        role: 'TECHNICIEN_HARDWARE',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const roles = [
        {
            value: 'ADMIN',
            label: 'Administrateur RMS',
            description: 'Gestion complète de la plateforme',
            icon: <AdminPanelSettings sx={{ color: '#d32f2f' }} />
        },
        {
            value: 'RESPONSABLE_SOFTWARE',
            label: 'Responsable Software',
            description: 'Planification et gestion des visites',
            icon: <ManageAccounts sx={{ color: '#1976d2' }} />
        },
        {
            value: 'TECHNICIEN_HARDWARE',
            label: 'Technicien Hardware',
            description: 'Consultation des plannings et interventions',
            icon: <Build sx={{ color: '#2e7d32' }} />
        },
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (!formData.nom || !formData.prenom || !formData.email || !formData.motPasse || !formData.role) {
            setError('Tous les champs obligatoires doivent être remplis');
            setLoading(false);
            return;
        }

        if (formData.motPasse !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            setLoading(false);
            return;
        }

        if (formData.motPasse.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            setLoading(false);
            return;
        }

        try {
            const { confirmPassword, ...userData } = formData;
            console.log('📤 Envoi des données:', userData);

            const response = await api.post('/auth/register', userData);
            console.log('📥 Réponse:', response.data);

            setSuccess('✅ Inscription réussie ! Vous pouvez maintenant vous connecter.');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            console.error('❌ Erreur détaillée:', error);
            console.error('📥 Réponse:', error.response?.data);
            console.error('📥 Statut:', error.response?.status);

            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else if (error.response?.data?.error) {
                setError(error.response.data.error);
            } else if (error.message) {
                setError('Erreur: ' + error.message);
            } else {
                setError('❌ Erreur lors de l\'inscription');
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
                    py: 4,
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
                            Créer votre compte
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
                            {success}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Nom"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    InputProps={{
                                        startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Prénom"
                                    name="prenom"
                                    value={formData.prenom}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    InputProps={{
                                        startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    InputProps={{
                                        startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Téléphone"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={handleChange}
                                    disabled={loading}
                                    InputProps={{
                                        startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth required>
                                    <InputLabel id="role-label">Rôle</InputLabel>
                                    <Select
                                        labelId="role-label"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        label="Rôle"
                                        disabled={loading}
                                        renderValue={(selected) => {
                                            const role = roles.find(r => r.value === selected);
                                            return (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {role?.icon}
                                                    <Typography>{role?.label || selected}</Typography>
                                                </Box>
                                            );
                                        }}
                                    >
                                        {roles.map((role) => (
                                            <MenuItem key={role.value} value={role.value}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 0.5 }}>
                                                    {role.icon}
                                                    <Box>
                                                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                            {role.label}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {role.description}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <FormHelperText>
                                        Choisissez votre rôle dans l'application
                                    </FormHelperText>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Mot de passe"
                                    name="motPasse"
                                    type="password"
                                    value={formData.motPasse}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    helperText="Minimum 6 caractères"
                                    InputProps={{
                                        startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Confirmer"
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    InputProps={{
                                        startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
                                    }}
                                />
                            </Grid>
                        </Grid>

                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            size="large"
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                            disabled={loading}
                            startIcon={!loading && <PersonAdd />}
                        >
                            {loading ? <CircularProgress size={24} /> : 'S\'inscrire'}
                        </Button>
                    </form>

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2">
                            Déjà un compte ?{' '}
                            <Link component={RouterLink} to="/login" sx={{ fontWeight: 'bold' }}>
                                Se connecter
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Register;