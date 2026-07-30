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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    Grid,
    TextField,
    MenuItem,
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Person } from '@mui/icons-material';
import api from '../../api/axiosConfig';

const TechnicianList = () => {
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTechnician, setSelectedTechnician] = useState(null);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        role: 'TECHNICIEN_HARDWARE',
        motPasse: '',
        actif: true,
    });

    useEffect(() => {
        fetchTechnicians();
    }, []);

    const fetchTechnicians = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/utilisateurs');
            const users = Array.isArray(response.data) ? response.data : [];
            const techs = users.filter(u => u.role === 'TECHNICIEN_HARDWARE');
            setTechnicians(techs);
        } catch (error) {
            console.error('Error fetching technicians:', error);
            setError('Erreur lors du chargement des techniciens');
            setTechnicians([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (tech = null) => {
        if (tech) {
            setSelectedTechnician(tech);
            setFormData({
                nom: tech.nom || '',
                prenom: tech.prenom || '',
                email: tech.email || '',
                telephone: tech.telephone || '',
                role: tech.role || 'TECHNICIEN_HARDWARE',
                motPasse: '',
                actif: tech.actif !== undefined ? tech.actif : true,
            });
        } else {
            setSelectedTechnician(null);
            setFormData({
                nom: '',
                prenom: '',
                email: '',
                telephone: '',
                role: 'TECHNICIEN_HARDWARE',
                motPasse: '',
                actif: true,
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedTechnician(null);
    };

    const handleSubmit = async () => {
        try {
            const data = { ...formData };
            if (!selectedTechnician) {
                if (!data.motPasse) {
                    setError('Le mot de passe est requis pour un nouveau technicien');
                    return;
                }
            }

            if (selectedTechnician) {
                await api.put(`/utilisateurs/${selectedTechnician.id}`, data);
            } else {
                await api.post('/auth/register', data);
            }
            handleCloseDialog();
            fetchTechnicians();
        } catch (error) {
            console.error('Error saving technician:', error);
            setError('Erreur lors de la sauvegarde');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce technicien ?')) {
            try {
                await api.delete(`/utilisateurs/${id}`);
                fetchTechnicians();
            } catch (error) {
                console.error('Error deleting technician:', error);
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
                <Typography variant="h4">Techniciens</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
                    Nouveau Technicien
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
                            <TableCell>Prénom</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Téléphone</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {technicians.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    Aucun technicien trouvé
                                </TableCell>
                            </TableRow>
                        ) : (
                            technicians.map((tech) => (
                                <TableRow key={tech.id}>
                                    <TableCell>{tech.id}</TableCell>
                                    <TableCell>{tech.nom}</TableCell>
                                    <TableCell>{tech.prenom}</TableCell>
                                    <TableCell>{tech.email}</TableCell>
                                    <TableCell>{tech.telephone || '-'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={tech.actif ? 'Actif' : 'Inactif'}
                                            color={tech.actif ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="small" onClick={() => handleOpenDialog(tech)}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(tech.id)}>
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedTechnician ? 'Modifier le Technicien' : 'Nouveau Technicien'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nom"
                                value={formData.nom}
                                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Prénom"
                                value={formData.prenom}
                                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Téléphone"
                                value={formData.telephone}
                                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                            />
                        </Grid>
                        {!selectedTechnician && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Mot de passe"
                                    type="password"
                                    value={formData.motPasse}
                                    onChange={(e) => setFormData({ ...formData, motPasse: e.target.value })}
                                    required
                                    helperText="Minimum 6 caractères"
                                />
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Annuler</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {selectedTechnician ? 'Modifier' : 'Créer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TechnicianList;