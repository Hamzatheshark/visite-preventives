// components/clients/ClientForm.js
import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Divider,
    Alert,
    CircularProgress,
    FormControlLabel,
    Switch,
    InputAdornment,
    MenuItem,
} from '@mui/material';
import {
    Phone,
    Email,
    Business,
    Save,
    Cancel,
    Person,
    LocationOn,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';

const ClientForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [client, setClient] = useState({
        nom: '',
        siteNom: '', // ✅ CHAMP AJOUTÉ
        telephone: '',
        emailContact: '',
        adresseSiege: '',
        nbVisitesAn: 4,
        actif: true,
    });

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        setClient(prev => ({
            ...prev,
            [name]: name === 'actif' ? checked : value
        }));
    };

    const validateForm = () => {
        if (!client.nom || client.nom.trim() === '') {
            setError('Le nom du client est requis');
            return false;
        }

        if (!client.siteNom || client.siteNom.trim() === '') {
            setError('Le nom du site est requis');
            return false;
        }

        if (!client.emailContact || client.emailContact.trim() === '') {
            setError('L\'email de contact est requis');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            console.log('📤 1. Création du client...');

            // 1. Créer le client
            const clientData = {
                nom: client.nom,
                telephone: client.telephone,
                emailContact: client.emailContact,
                adresseSiege: client.adresseSiege,
                nbVisitesAn: client.nbVisitesAn || 4,
                actif: client.actif,
            };

            const clientResponse = await api.post('/clients', clientData);
            const createdClient = clientResponse.data;
            console.log('✅ Client créé avec ID:', createdClient.id);

            // 2. Créer le site avec le nom que VOUS avez saisi
            console.log('📤 2. Création du site...');
            const siteData = {
                client: { id: createdClient.id },
                nom: client.siteNom, // ✅ Utiliser le champ saisi par l'utilisateur
                adresse: client.adresseSiege,
                telephone: client.telephone,
                emailContact: client.emailContact,
                actif: client.actif,
            };

            const siteResponse = await api.post('/sites', siteData);
            console.log('✅ Site créé avec ID:', siteResponse.data.id);

            console.log('📤 3. Redirection vers /clients...');
            navigate('/clients', { state: { refresh: Date.now() } });

        } catch (err) {
            console.error('❌ ERREUR COMPLÈTE:', err);
            console.error('❌ Réponse du serveur:', err.response?.data);
            console.error('❌ Status:', err.response?.status);

            const errorMessage = err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Erreur lors de la création';
            setError(errorMessage);
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5">
                        <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Nouveau Client
                    </Typography>
                    <Box>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/clients')}
                            sx={{ mr: 1 }}
                            startIcon={<Cancel />}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                        >
                            {loading ? 'Création...' : 'Créer'}
                        </Button>
                    </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Informations du Client
                </Typography>
                <Grid container spacing={2}>
                    {/* ✅ CHAMP NOM DU CLIENT */}
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Nom du client *"
                            name="nom"
                            value={client.nom}
                            onChange={handleChange}
                            required
                            variant="outlined"
                            placeholder="Ex: amine"
                        />
                    </Grid>

                    {/* ✅ CHAMP NOM DU SITE (AJOUTÉ) */}
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Nom du site *"
                            name="siteNom"
                            value={client.siteNom}
                            onChange={handleChange}
                            required
                            variant="outlined"
                            placeholder="Ex: barcelona"
                            helperText="Ce nom s'affichera comme: amine (barcelona)"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LocationOn />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Email Contact *"
                            name="emailContact"
                            type="email"
                            value={client.emailContact}
                            onChange={handleChange}
                            required
                            variant="outlined"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Email />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Téléphone"
                            name="telephone"
                            value={client.telephone}
                            onChange={handleChange}
                            variant="outlined"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Phone />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Adresse"
                            name="adresseSiege"
                            value={client.adresseSiege}
                            onChange={handleChange}
                            variant="outlined"
                            multiline
                            rows={2}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LocationOn />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            select
                            label="Nombre de visites par an"
                            name="nbVisitesAn"
                            value={client.nbVisitesAn}
                            onChange={handleChange}
                            variant="outlined"
                        >
                            <MenuItem value={2}>2 visites par an</MenuItem>
                            <MenuItem value={4}>4 visites par an</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={client.actif}
                                    onChange={handleChange}
                                    name="actif"
                                    color="primary"
                                />
                            }
                            label="Client actif"
                        />
                    </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/clients')}
                        startIcon={<Cancel />}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                        size="large"
                    >
                        {loading ? 'Création en cours...' : 'Créer le client'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default ClientForm;