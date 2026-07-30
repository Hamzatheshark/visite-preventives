// components/clients/ClientList.js - VERSION SANS PLANIFICATION PARTICULIERE
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
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    Refresh,
    EventNote,
    Business,
    Search,
    Clear,
    Phone,
    Email,
    CheckCircle,
    Cancel as CancelIcon,
    LocationOn,
    PlayArrow,
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
    const [actionLoading, setActionLoading] = useState({});

    useEffect(() => {
        fetchClients();
    }, [location.key]);

    const fetchClients = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/clients');
            console.log('📥 Clients reçus:', response.data);
            setClients(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('❌ Erreur:', error);
            setError('Erreur lors du chargement des clients');
        } finally {
            setLoading(false);
        }
    };

    // ✅ UNIQUEMENT ce bouton pour planifier pour tous les clients
    const handlePlanifierProchaineTous = async () => {
        if (!window.confirm('Planifier UNIQUEMENT la prochaine visite pour tous les clients ?')) {
            return;
        }

        setPlanifying(true);
        setError(null);

        try {
            await api.post('/plannings/lancer-planification-prochaine');
            alert('✅ Prochaine visite planifiée pour tous les clients avec succès !');
            fetchClients();
        } catch (error) {
            console.error('❌ Erreur:', error);
            const message = error.response?.data || 'Erreur lors de la planification';
            setError(message);
            alert('❌ ' + message);
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

    const filteredClients = clients.filter(client =>
        client.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.emailContact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.telephone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.adresseSiege?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.siteNom?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getVisitesLabel = (nb) => {
        const labels = { 1: '1 visite/an', 2: '2 visites/an', 4: '4 visites/an', 6: '6 visites/an', 12: '12 visites/an' };
        return labels[nb] || `${nb} visites/an`;
    };

    // ✅ Vérifier si une visite existe pour ce client
    const isVisiteExistante = (client, numVisite) => {
        if (!client) return false;
        if (client.plannings) {
            return client.plannings.some(p => p.numVisite === numVisite);
        }
        return false;
    };

    if (loading && clients.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Chargement des clients...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* HEADER */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h4">
                    <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Clients
                    <Chip label={`${filteredClients.length} client(s)`} size="small" sx={{ ml: 2 }} />
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {/* ✅ UNIQUE BOUTON DE PLANIFICATION */}
                    <Tooltip title="Planifier UNIQUEMENT la prochaine visite pour tous les clients">
                        <Button
                            variant="contained"
                            color="info"
                            startIcon={<PlayArrow />}
                            onClick={handlePlanifierProchaineTous}
                            disabled={planifying}
                        >
                            {planifying ? 'Planification...' : '📌 Prochaine visite (tous)'}
                        </Button>
                    </Tooltip>

                    <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/clients/new')}>
                        Nouveau Client
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            {/* RECHERCHE */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Search sx={{ color: 'text.secondary' }} />
                    <TextField
                        label="Rechercher un client..."
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flexGrow: 1 }}
                        InputProps={{
                            endAdornment: searchTerm && (
                                <IconButton size="small" onClick={() => setSearchTerm('')}>
                                    <Clear />
                                </IconButton>
                            ),
                        }}
                    />
                    <Button variant="outlined" startIcon={<Refresh />} onClick={fetchClients}>
                        Actualiser
                    </Button>
                </Box>
            </Paper>

            {/* LISTE */}
            {filteredClients.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center' }}>
                    <Business sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                        {clients.length === 0 ? 'Aucun client enregistré' : 'Aucun client ne correspond à votre recherche'}
                    </Typography>
                    {clients.length === 0 && (
                        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/clients/new')} sx={{ mt: 2 }}>
                            Ajouter un client
                        </Button>
                    )}
                </Paper>
            ) : (
                filteredClients.map((client) => {
                    const nbVisitesAn = client.nbVisitesAn || 4;

                    return (
                        <Card key={client.id || client.siteId} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                            <CardContent>
                                {/* ===== NOM CLIENT + SITE ===== */}
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        {client.nom || 'Client sans nom'}
                                    </Typography>
                                    {client.siteNom && (
                                        <Chip
                                            label={client.siteNom}
                                            size="small"
                                            sx={{
                                                borderRadius: 1,
                                                backgroundColor: '#e3f2fd',
                                                color: '#1976d2',
                                            }}
                                        />
                                    )}
                                    <Box sx={{ flexGrow: 1 }} />
                                    <Chip label={getVisitesLabel(client.nbVisitesAn || 4)} size="small" color="primary" />
                                    {client.actif ? (
                                        <Chip label="Actif" size="small" color="success" icon={<CheckCircle />} />
                                    ) : (
                                        <Chip label="Inactif" size="small" icon={<CancelIcon />} />
                                    )}
                                </Box>

                                {/* ===== INFOS ===== */}
                                <Grid container spacing={1} sx={{ mb: 1 }}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Email fontSize="small" color="action" /> {client.emailContact || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Phone fontSize="small" color="action" /> {client.telephone || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    {client.adresseSiege && (
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <LocationOn fontSize="small" /> {client.adresseSiege}
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>

                                {/* ===== STATUT DES VISITES ===== */}
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                    <Typography variant="caption" color="textSecondary" sx={{ mr: 1 }}>
                                        Visites:
                                    </Typography>
                                    {[1, 2, 3, 4].map((num) => {
                                        if (num > nbVisitesAn) return null;
                                        const existe = isVisiteExistante(client, num);
                                        return (
                                            <Chip
                                                key={num}
                                                label={`V${num}`}
                                                size="small"
                                                color={existe ? 'success' : 'default'}
                                                variant={existe ? 'filled' : 'outlined'}
                                                sx={{ height: 20, fontSize: '10px' }}
                                            />
                                        );
                                    })}
                                </Box>

                                {/* ===== ACTIONS ===== */}
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<Edit />}
                                        onClick={() => navigate(`/clients/edit/${client.id}`)}
                                    >
                                        Modifier
                                    </Button>

                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="error"
                                        startIcon={<Delete />}
                                        onClick={() => handleDeleteClick(client)}
                                    >
                                        Supprimer
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    );
                })
            )}

            {/* Dialog suppression */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle sx={{ color: 'error.main' }}>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <Typography>
                        Voulez-vous vraiment supprimer le client <strong>"{clientToDelete?.nom}"</strong> ?
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Cette action supprimera également tous les sites et contrats associés.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
                    <Button onClick={handleDeleteConfirm} variant="contained" color="error" startIcon={<Delete />}>
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ClientList;