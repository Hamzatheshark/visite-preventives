// components/clients/ClientList.js - VERSION PROFESSIONNELLE
import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Chip,
    TextField,
    IconButton,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    Avatar,
    Divider,
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    Refresh,
    Business,
    Search,
    Clear,
    Phone,
    Email,
    CheckCircle,
    Cancel as CancelIcon,
    LocationOn,
    PlayArrow,
    Store,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';

const ClientList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);
    const [planifying, setPlanifying] = useState(false);

    useEffect(() => {
        fetchClients();
    }, [location.key]);

    const fetchClients = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/clients');
            setClients(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('❌ Erreur:', error);
            setError('Erreur lors du chargement des clients');
        } finally {
            setLoading(false);
        }
    };

    const handlePlanifierProchaineTous = async () => {
        if (!window.confirm('Planifier la prochaine visite pour tous les clients ?')) return;

        setPlanifying(true);
        setError(null);

        try {
            await api.post('/plannings/lancer-planification-prochaine');
            alert('✅ Prochaine visite planifiée pour tous les clients !');
            fetchClients();
        } catch (error) {
            console.error('❌ Erreur:', error);
            setError(error.response?.data || 'Erreur lors de la planification');
            alert('❌ Erreur lors de la planification');
        } finally {
            setPlanifying(false);
        }
    };

    const handleDeleteClick = (client) => {
        setClientToDelete(client);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!clientToDelete) return;
        try {
            await api.delete(`/clients/${clientToDelete.id}`);
            setDeleteDialogOpen(false);
            setClientToDelete(null);
            await fetchClients();
            alert('✅ Client supprimé avec succès !');
        } catch (error) {
            console.error('❌ Erreur:', error);
            setError('Erreur lors de la suppression');
            setDeleteDialogOpen(false);
        }
    };

    const getInitials = (nom) => {
        if (!nom) return '?';
        return nom.charAt(0).toUpperCase();
    };

    const getColorFromName = (nom) => {
        const colors = [
            '#1976d2', '#2e7d32', '#d32f2f', '#ed6c02', '#9c27b0',
            '#0288d1', '#00897b', '#c62828', '#ef6c00', '#6a1b9a',
            '#00695c', '#ad1457', '#2e7d32', '#4527a0', '#bf360c'
        ];
        let hash = 0;
        if (nom) {
            for (let i = 0; i < nom.length; i++) {
                hash = nom.charCodeAt(i) + ((hash << 5) - hash);
            }
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const getVisitesLabel = (nb) => {
        const labels = { 1: '1 visite/an', 2: '2 visites/an', 4: '4 visites/an', 6: '6 visites/an', 12: '12 visites/an' };
        return labels[nb] || `${nb} visites/an`;
    };

    const filteredClients = clients.filter(client =>
        client.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.siteNom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.emailContact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.telephone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.adresseSiege?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && clients.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2, color: 'text.secondary' }}>Chargement...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            {/* Header */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    bgcolor: 'white',
                    border: '1px solid #e8ecf1',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#0044CC', width: 40, height: 40 }}>
                        <Business sx={{ color: 'white' }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                            Clients & Sites
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {filteredClients.length} site(s)
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<PlayArrow />}
                        onClick={handlePlanifierProchaineTous}
                        disabled={planifying}
                        size="small"
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        {planifying ? '...' : '📌 Prochaine visite'}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate('/clients/new')}
                        size="small"
                        sx={{ borderRadius: 2, textTransform: 'none', bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
                    >
                        Nouveau Client
                    </Button>
                </Box>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Search */}
            <Paper
                elevation={0}
                sx={{
                    p: 1.5,
                    mb: 3,
                    borderRadius: 2,
                    bgcolor: 'white',
                    border: '1px solid #e8ecf1',
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'center',
                }}
            >
                <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                <TextField
                    size="small"
                    placeholder="Rechercher un client ou un site..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ flexGrow: 1 }}
                    InputProps={{
                        endAdornment: searchTerm && (
                            <IconButton size="small" onClick={() => setSearchTerm('')}>
                                <Clear fontSize="small" />
                            </IconButton>
                        ),
                        sx: { borderRadius: 2, height: 38 }
                    }}
                />
                <Button variant="outlined" startIcon={<Refresh />} onClick={fetchClients} size="small" sx={{ borderRadius: 2, textTransform: 'none' }}>
                    Actualiser
                </Button>
            </Paper>

            {/* Grid */}
            {filteredClients.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
                    <Business sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                        {clients.length === 0 ? 'Aucun client enregistré' : 'Aucun résultat'}
                    </Typography>
                    {clients.length === 0 && (
                        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/clients/new')} sx={{ mt: 2 }}>
                            Ajouter un client
                        </Button>
                    )}
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {filteredClients.map((client) => (
                        <Grid item xs={12} sm={6} md={4} key={client.id || client.siteId}>
                            <Card
                                sx={{
                                    height: '100%',
                                    borderRadius: 2,
                                    border: '1px solid #e8ecf1',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    '&:hover': {
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                            >
                                <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
                                    {/* En-tête */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                        <Avatar
                                            sx={{
                                                bgcolor: getColorFromName(client.nom),
                                                width: 36,
                                                height: 36,
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {getInitials(client.nom)}
                                        </Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                                                {client.nom || 'Client sans nom'}
                                            </Typography>
                                            {client.siteNom && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Store fontSize="small" sx={{ fontSize: 14 }} /> {client.siteNom}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>

                                    <Divider sx={{ my: 1.5 }} />

                                    {/* Contact */}
                                    <Box sx={{ mt: 1 }}>
                                        {client.emailContact && (
                                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, fontSize: '0.85rem' }}>
                                                <Email sx={{ fontSize: 16, color: 'text.secondary' }} /> {client.emailContact}
                                            </Typography>
                                        )}
                                        {client.telephone && (
                                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, fontSize: '0.85rem' }}>
                                                <Phone sx={{ fontSize: 16, color: 'text.secondary' }} /> {client.telephone}
                                            </Typography>
                                        )}
                                        {client.adresseSiege && (
                                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem' }}>
                                                <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} /> {client.adresseSiege}
                                            </Typography>
                                        )}
                                    </Box>

                                    {/* Tags */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1.5 }}>
                                        <Chip
                                            label={getVisitesLabel(client.nbVisitesAn || 4)}
                                            size="small"
                                            sx={{
                                                height: 22,
                                                fontSize: '0.7rem',
                                                bgcolor: '#e3f2fd',
                                                color: '#1976d2',
                                            }}
                                        />
                                        {client.actif !== false ? (
                                            <Chip
                                                label="Actif"
                                                size="small"
                                                sx={{
                                                    height: 22,
                                                    fontSize: '0.7rem',
                                                    bgcolor: '#e8f5e9',
                                                    color: '#2e7d32',
                                                }}
                                            />
                                        ) : (
                                            <Chip
                                                label="Inactif"
                                                size="small"
                                                sx={{
                                                    height: 22,
                                                    fontSize: '0.7rem',
                                                    bgcolor: '#fbe9e7',
                                                    color: '#c62828',
                                                }}
                                            />
                                        )}
                                    </Box>
                                </CardContent>

                                {/* Actions */}
                                <Box sx={{ p: 2, pt: 0, borderTop: '1px solid #f0f0f0' }}>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<Edit />}
                                            onClick={() => navigate(`/clients/edit/${client.id}`)}
                                            sx={{ borderRadius: 2, textTransform: 'none', flex: 1, fontSize: '0.75rem' }}
                                        >
                                            Modifier
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            startIcon={<Delete />}
                                            onClick={() => handleDeleteClick(client)}
                                            sx={{ borderRadius: 2, textTransform: 'none', minWidth: 36, px: 1 }}
                                        />
                                    </Box>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Dialog suppression */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle sx={{ color: 'error.main' }}>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <Typography>
                        Supprimer <strong>"{clientToDelete?.nom}"</strong> ?
                    </Typography>
                    {clientToDelete?.siteNom && (
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Site: {clientToDelete.siteNom}
                        </Typography>
                    )}
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Cette action est irréversible.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} size="small">Annuler</Button>
                    <Button onClick={handleDeleteConfirm} variant="contained" color="error" size="small">
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ClientList;