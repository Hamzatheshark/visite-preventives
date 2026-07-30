import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Button,
    IconButton,
    Chip,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    Grid,
} from '@mui/material';
import { Add, Edit, Delete, Refresh, LocationOn } from '@mui/icons-material';
import api from '../../api/axiosConfig';

const SiteList = () => {
    const [sites, setSites] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedSite, setSelectedSite] = useState(null);
    const [formData, setFormData] = useState({
        nom: '',
        adresse: '',
        latitude: '',
        longitude: '',
        emailContact: '',
        telephone: '',
        clientId: '',
        actif: true,
    });

    useEffect(() => {
        fetchSites();
        fetchClients();
    }, []);

    const fetchSites = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/sites');
            setSites(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching sites:', error);
            setError('Erreur lors du chargement des sites');
            setSites([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const response = await api.get('/clients');
            setClients(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const handleOpenDialog = (site = null) => {
        if (site) {
            setSelectedSite(site);
            setFormData({
                nom: site.nom || '',
                adresse: site.adresse || '',
                latitude: site.latitude || '',
                longitude: site.longitude || '',
                emailContact: site.emailContact || '',
                telephone: site.telephone || '',
                clientId: site.client?.id || '',
                actif: site.actif !== undefined ? site.actif : true,
            });
        } else {
            setSelectedSite(null);
            setFormData({
                nom: '',
                adresse: '',
                latitude: '',
                longitude: '',
                emailContact: '',
                telephone: '',
                clientId: '',
                actif: true,
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedSite(null);
    };

    const handleSubmit = async () => {
        try {
            const data = {
                ...formData,
                client: { id: parseInt(formData.clientId) },
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            };

            if (selectedSite) {
                await api.put(`/sites/${selectedSite.id}`, data);
            } else {
                await api.post('/sites', data);
            }
            handleCloseDialog();
            fetchSites();
        } catch (error) {
            console.error('Error saving site:', error);
            setError('Erreur lors de la sauvegarde');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce site ?')) {
            try {
                await api.delete(`/sites/${id}`);
                fetchSites();
            } catch (error) {
                console.error('Error deleting site:', error);
                setError('Erreur lors de la suppression');
            }
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Gestion des Sites</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
                    Nouveau Site
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Nom</TableCell>
                            <TableCell>Client</TableCell>
                            <TableCell>Adresse</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Téléphone</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sites.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    Aucun site trouvé
                                </TableCell>
                            </TableRow>
                        ) : (
                            sites.map((site) => (
                                <TableRow key={site.id}>
                                    <TableCell>{site.id}</TableCell>
                                    <TableCell>{site.nom}</TableCell>
                                    <TableCell>{site.client?.nom || 'N/A'}</TableCell>
                                    <TableCell>{site.adresse || '-'}</TableCell>
                                    <TableCell>{site.emailContact || '-'}</TableCell>
                                    <TableCell>{site.telephone || '-'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={site.actif ? 'Actif' : 'Inactif'}
                                            color={site.actif ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="small" onClick={() => handleOpenDialog(site)}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(site.id)}>
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedSite ? 'Modifier le Site' : 'Nouveau Site'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nom du site"
                                value={formData.nom}
                                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Client"
                                value={formData.clientId}
                                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                required
                                SelectProps={{ native: true }}
                            >
                                <option value="">Sélectionner un client</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.nom}
                                    </option>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Téléphone"
                                value={formData.telephone}
                                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Adresse"
                                value={formData.adresse}
                                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                                multiline
                                rows={2}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email de contact"
                                type="email"
                                value={formData.emailContact}
                                onChange={(e) => setFormData({ ...formData, emailContact: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Latitude"
                                type="number"
                                value={formData.latitude}
                                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Longitude"
                                type="number"
                                value={formData.longitude}
                                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Annuler</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {selectedSite ? 'Modifier' : 'Créer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SiteList;