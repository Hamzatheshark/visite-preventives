// components/planning/PlanningList.js - CORRIGÉ
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
    Chip,
    IconButton,
    Tooltip,
    Button,
    TextField,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    Grid,
    FormControl,
    InputLabel,
    Select,
    Card,
    CardContent,
} from '@mui/material';
import {
    Refresh,
    Visibility,
    CheckCircle,
    Cancel,
    AttachFile,
    PersonAdd,
    EventNote,
    Email,
    History,
    Download,
    Delete as DeleteIcon,
    Clear,
    CalendarToday,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import webSocketService from '../../services/websocketService';

const statusColors = {
    EN_ATTENTE: { color: '#ff9800', bg: '#fff3cd', label: 'En attente' },
    ACCEPTE: { color: '#4caf50', bg: '#d4edda', label: 'Accepté' },
    REFUSE: { color: '#f44336', bg: '#f8d7da', label: 'Refusé' },
    RELANCE: { color: '#ff6f00', bg: '#fff3cd', label: 'Relancé' },
    CONFIRME: { color: '#1976d2', bg: '#cce5ff', label: 'Confirmé' },
    REALISE: { color: '#6c757d', bg: '#e2e3e5', label: 'Réalisé' },
    ANNULE: { color: '#000000', bg: '#e9ecef', label: 'Annulé' },
};

const VISIBLE_STATUSES = ['EN_ATTENTE', 'ACCEPTE', 'REFUSE', 'RELANCE', 'CONFIRME'];

const PlanningList = () => {
    const navigate = useNavigate();
    const [plannings, setPlannings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlanning, setSelectedPlanning] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedForAssign, setSelectedForAssign] = useState(null);
    const [techniciens, setTechniciens] = useState([]);
    const [responsables, setResponsables] = useState([]);
    const [selectedTechnicienId, setSelectedTechnicienId] = useState('');
    const [selectedResponsableId, setSelectedResponsableId] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);

    // ✅ States pour la relance avec choix de date (UNIQUEMENT POUR REFUSE)
    const [relanceDialogOpen, setRelanceDialogOpen] = useState(false);
    const [selectedForRelance, setSelectedForRelance] = useState(null);
    const [newDate, setNewDate] = useState('');
    const [dateError, setDateError] = useState('');
    const [relanceLoading, setRelanceLoading] = useState(false);

    useEffect(() => {
        fetchPlannings();
        fetchTechniciensEtResponsables();
        webSocketService.addStatusListener(handleStatusChange);
        return () => {
            webSocketService.removeStatusListener(handleStatusChange);
        };
    }, [filter]);

    const handleStatusChange = (data) => {
        console.log('🔄 [WebSocket] Changement de statut reçu:', data);
        fetchPlannings();
    };

    const fetchPlannings = async () => {
        setLoading(true);
        setError(null);
        try {
            let url = '/plannings';
            if (filter) {
                url = `/plannings/statut/${filter}`;
            }
            const response = await api.get(url);
            console.log('📋 Plannings reçus:', response.data);
            let data = Array.isArray(response.data) ? response.data : [];
            data = data.filter(p => p.statut !== 'ANNULE' && p.statut !== 'REALISE');
            setPlannings(data);
        } catch (error) {
            console.error('❌ Erreur:', error);
            setError('Erreur lors du chargement des plannings');
        } finally {
            setLoading(false);
        }
    };

    const fetchTechniciensEtResponsables = async () => {
        setLoadingUsers(true);
        try {
            const response = await api.get('/utilisateurs');
            const allUsers = Array.isArray(response.data) ? response.data : [];
            const techs = allUsers.filter(u =>
                u.actif === true &&
                (u.role === 'TECHNICIEN_HARDWARE' || u.role === 'TECHNICEN_HARDWARE')
            );
            const resp = allUsers.filter(u =>
                u.actif === true &&
                u.role === 'RESPONSABLE_SOFTWARE'
            );
            setTechniciens(techs);
            setResponsables(resp);
        } catch (error) {
            console.error('❌ Erreur:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleAccepter = async (planningId) => {
        if (!window.confirm('Confirmer l\'acceptation de cette visite ?')) return;
        try {
            await api.post(`/plannings/reponse/${planningId}?accepte=true`);
            alert('✅ Visite acceptée avec succès !');
            fetchPlannings();
        } catch (error) {
            console.error('❌ Erreur:', error);
            alert('❌ Erreur lors du traitement');
        }
    };

    const handleAnnuler = async (planningId) => {
        if (!window.confirm('Confirmer l\'annulation définitive de cette visite ?')) return;
        try {
            await api.post(`/plannings/annuler/${planningId}`);
            alert('✅ Visite annulée avec succès !');
            fetchPlannings();
        } catch (error) {
            console.error('❌ Erreur:', error);
            alert('❌ Erreur lors de l\'annulation');
        }
    };

    const handleRelance = async (planningId) => {
        if (!window.confirm('Envoyer une relance pour cette visite ?')) return;
        try {
            await api.post(`/plannings/relance/${planningId}`);
            alert('✅ Relance envoyée avec succès !');
            fetchPlannings();
        } catch (error) {
            console.error('❌ Erreur:', error);
            alert('❌ Erreur lors de l\'envoi de la relance');
        }
    };

    // ✅ Ouvrir le dialog de choix de date pour REFUSE UNIQUEMENT
    const handleOpenRelanceDialog = (planning) => {
        setSelectedForRelance(planning);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setNewDate(tomorrow.toISOString().split('T')[0]);
        setDateError('');
        setRelanceDialogOpen(true);
    };

    // ✅ Confirmer la date choisie -> devient date confirmée directement
    const handleConfirmRelance = async () => {
        if (!newDate) {
            setDateError('Veuillez sélectionner une date');
            return;
        }

        const selectedDate = new Date(newDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            setDateError('La date ne peut pas être dans le passé');
            return;
        }

        const dayOfWeek = selectedDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            setDateError('La date ne peut pas être un week-end');
            return;
        }

        if (selectedDate.getMonth() === 7) {
            setDateError('La date ne peut pas être en août');
            return;
        }

        setRelanceLoading(true);
        try {
            // ✅ On envoie la date choisie qui devient directement date confirmée
            const response = await api.post(`/plannings/relancer/${selectedForRelance.id}`, {
                nouvelleDate: newDate,
                confirmerDirectement: true  // ✅ Flag pour confirmer directement
            });
            console.log('✅ Réponse relance:', response.data);
            alert('✅ Visite confirmée avec la nouvelle date !');
            setRelanceDialogOpen(false);
            fetchPlannings();
        } catch (error) {
            console.error('❌ Erreur détaillée:', error);
            console.error('❌ Response:', error.response);
            const errorMessage = error.response?.data || error.message || 'Erreur lors de la relance';
            alert('❌ Erreur lors de la relance: ' + errorMessage);
        } finally {
            setRelanceLoading(false);
        }
    };

    const handleViewDetails = (planning) => {
        setSelectedPlanning(planning);
        setDialogOpen(true);
    };

    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await api.get('/utilisateurs');
            const allUsers = Array.isArray(response.data) ? response.data : [];
            const techs = allUsers.filter(u =>
                u.actif === true &&
                (u.role === 'TECHNICIEN_HARDWARE' || u.role === 'TECHNICEN_HARDWARE')
            );
            const resp = allUsers.filter(u =>
                u.actif === true &&
                u.role === 'RESPONSABLE_SOFTWARE'
            );
            setTechniciens(techs);
            setResponsables(resp);
        } catch (error) {
            console.error('❌ Erreur:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleAssigner = async () => {
        if (!selectedTechnicienId) {
            alert('Veuillez sélectionner un technicien');
            return;
        }
        if (!selectedResponsableId) {
            alert('Veuillez sélectionner un responsable');
            return;
        }
        try {
            await api.post(
                `/plannings/assigner-technicien/${selectedForAssign.id}?technicienId=${selectedTechnicienId}`
            );
            await api.post(
                `/plannings/assigner-responsable/${selectedForAssign.id}?responsableId=${selectedResponsableId}`
            );
            alert('✅ Technicien et responsable assignés avec succès !');
            setAssignDialogOpen(false);
            setSelectedTechnicienId('');
            setSelectedResponsableId('');
            fetchPlannings();
        } catch (error) {
            console.error('❌ Erreur:', error);
            alert('❌ Erreur lors de l\'assignation');
        }
    };

    const handleUploadPI = (planningId) => {
        navigate(`/upload-pi/${planningId}`);
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const filteredPlannings = plannings.filter(p => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            (p.clientNom || '').toLowerCase().includes(search) ||
            (p.siteNom || '').toLowerCase().includes(search) ||
            (p.numVisite ? `v${p.numVisite}` : '').includes(search) ||
            (p.statut || '').toLowerCase().includes(search) ||
            (p.technicienNom || '').toLowerCase().includes(search) ||
            (p.responsableNom || '').toLowerCase().includes(search)
        );
    });

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Chargement des visites...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            {/* En-tête */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                    📋 Planning des Visites
                    <Chip label={`${filteredPlannings.length} visite(s)`} size="small" sx={{ ml: 2 }} />
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Refresh />}
                    onClick={fetchPlannings}
                    size="small"
                    sx={{
                        bgcolor: '#0044CC',
                        '&:hover': { bgcolor: '#0033aa' },
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 3,
                    }}
                >
                    Actualiser
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Filtres */}
            <Card sx={{ mb: 2, borderRadius: 2, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                <CardContent sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <TextField
                            label="Rechercher..."
                            variant="outlined"
                            size="small"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{ flexGrow: 1, minWidth: 180 }}
                            InputProps={{ sx: { borderRadius: 1.5 } }}
                            placeholder="Client, site, numéro..."
                        />
                        <TextField
                            select
                            label="Filtrer par statut"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            size="small"
                            sx={{ minWidth: 160 }}
                            SelectProps={{ sx: { borderRadius: 1.5 } }}
                        >
                            <MenuItem value="">Tous les statuts</MenuItem>
                            {Object.entries(statusColors)
                                .filter(([key]) => VISIBLE_STATUSES.includes(key))
                                .map(([key, value]) => (
                                    <MenuItem key={key} value={key}>
                                        <Chip label={value.label} size="small" sx={{ bgcolor: value.bg, color: value.color }} />
                                    </MenuItem>
                                ))}
                        </TextField>
                        {filter && (
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Clear />}
                                onClick={() => setFilter('')}
                                sx={{ borderRadius: 1.5, textTransform: 'none' }}
                            >
                                Effacer
                            </Button>
                        )}
                    </Box>
                </CardContent>
            </Card>

            {/* Tableau */}
            {filteredPlannings.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                    <Typography color="textSecondary" variant="h6">
                        {plannings.length === 0 ? 'Aucune visite trouvée' : 'Aucune visite ne correspond aux filtres'}
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                <TableCell sx={{ fontWeight: 600, py: 1, px: 1.5, width: '80px' }}>N° Visite</TableCell>
                                <TableCell sx={{ fontWeight: 600, py: 1, px: 1.5, width: '120px' }}>Client</TableCell>
                                <TableCell sx={{ fontWeight: 600, py: 1, px: 1.5, width: '140px' }}>Site</TableCell>
                                <TableCell sx={{ fontWeight: 600, py: 1, px: 1.5, width: '110px' }}>Date proposée</TableCell>
                                <TableCell sx={{ fontWeight: 600, py: 1, px: 1.5, width: '110px' }}>Date confirmée</TableCell>
                                <TableCell sx={{ fontWeight: 600, py: 1, px: 1.5, width: '120px' }}>Statut</TableCell>
                                <TableCell sx={{ fontWeight: 600, py: 1, px: 1.5, width: '130px' }}>Technicien</TableCell>
                                <TableCell sx={{ fontWeight: 600, py: 1, px: 1.5, width: '130px' }}>Responsable</TableCell>
                                <TableCell sx={{ fontWeight: 600, py: 1, px: 1.5, width: '240px' }} align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredPlannings.map((planning) => (
                                <TableRow key={planning.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell sx={{ py: 1, px: 1.5 }}>
                                        <Chip label={`V${planning.numVisite || '?'}`} size="small" variant="outlined" sx={{ borderRadius: 1, height: 24, fontSize: '0.75rem' }} />
                                    </TableCell>
                                    <TableCell sx={{ py: 1, px: 1.5, fontSize: '0.875rem' }}>{planning.clientNom || 'N/A'}</TableCell>
                                    <TableCell sx={{ py: 1, px: 1.5, fontSize: '0.875rem' }}>{planning.siteNom || 'N/A'}</TableCell>
                                    <TableCell sx={{ py: 1, px: 1.5, fontSize: '0.875rem' }}>{formatDate(planning.dateProposee)}</TableCell>
                                    <TableCell sx={{ py: 1, px: 1.5, fontSize: '0.875rem' }}>{formatDate(planning.dateConfirmee)}</TableCell>
                                    <TableCell sx={{ py: 1, px: 1.5 }}>
                                        <Chip
                                            label={statusColors[planning.statut]?.label || planning.statut || 'N/A'}
                                            size="small"
                                            sx={{
                                                bgcolor: statusColors[planning.statut]?.bg || '#e9ecef',
                                                color: statusColors[planning.statut]?.color || '#000',
                                                borderRadius: 1,
                                                height: 24,
                                                fontSize: '0.75rem',
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ py: 1, px: 1.5 }}>
                                        {planning.technicienNom ?
                                            <Chip label={planning.technicienNom} size="small" variant="outlined" sx={{ borderRadius: 1, height: 24, fontSize: '0.75rem' }} /> :
                                            <Chip label="Non assigné" size="small" variant="outlined" sx={{ borderRadius: 1, height: 24, fontSize: '0.75rem' }} />
                                        }
                                    </TableCell>
                                    <TableCell sx={{ py: 1, px: 1.5 }}>
                                        {planning.responsableNom ?
                                            <Chip label={planning.responsableNom} size="small" variant="outlined" sx={{ borderRadius: 1, height: 24, fontSize: '0.75rem' }} /> :
                                            <Chip label="Non assigné" size="small" variant="outlined" sx={{ borderRadius: 1, height: 24, fontSize: '0.75rem' }} />
                                        }
                                    </TableCell>
                                    <TableCell align="center" sx={{ py: 1, px: 1.5 }}>
                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                                            {/* Voir détails */}
                                            <Tooltip title="Voir détails">
                                                <IconButton size="small" onClick={() => handleViewDetails(planning)} sx={{ p: 0.5 }}>
                                                    <Visibility fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            {/* EN_ATTENTE */}
                                            {planning.statut === 'EN_ATTENTE' && (
                                                <>
                                                    <Tooltip title="Accepter">
                                                        <IconButton size="small" sx={{ color: '#4caf50', p: 0.5 }} onClick={() => handleAccepter(planning.id)}>
                                                            <CheckCircle fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Annuler">
                                                        <IconButton size="small" sx={{ color: '#f44336', p: 0.5 }} onClick={() => handleAnnuler(planning.id)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}

                                            {/* ACCEPTE */}
                                            {planning.statut === 'ACCEPTE' && (
                                                <>
                                                    <Tooltip title="Assigner">
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: '#1976d2', p: 0.5 }}
                                                            onClick={async () => {
                                                                await loadUsers();
                                                                setSelectedForAssign(planning);
                                                                setSelectedTechnicienId('');
                                                                setSelectedResponsableId('');
                                                                setAssignDialogOpen(true);
                                                            }}
                                                        >
                                                            <PersonAdd fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Annuler">
                                                        <IconButton size="small" sx={{ color: '#f44336', p: 0.5 }} onClick={() => handleAnnuler(planning.id)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}

                                            {/* ✅ REFUSE - UNIQUEMENT POUR REFUSE (bouton de choix de date) */}
                                            {planning.statut === 'REFUSE' && (
                                                <>
                                                    <Tooltip title="Choisir une date (confirmation directe)">
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: '#ff6f00', p: 0.5 }}
                                                            onClick={() => handleOpenRelanceDialog(planning)}
                                                        >
                                                            <CalendarToday fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Annuler">
                                                        <IconButton size="small" sx={{ color: '#f44336', p: 0.5 }} onClick={() => handleAnnuler(planning.id)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}

                                            {/* RELANCE */}
                                            {planning.statut === 'RELANCE' && (
                                                <>
                                                    <Tooltip title="Accepter">
                                                        <IconButton size="small" sx={{ color: '#4caf50', p: 0.5 }} onClick={() => handleAccepter(planning.id)}>
                                                            <CheckCircle fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Annuler">
                                                        <IconButton size="small" sx={{ color: '#f44336', p: 0.5 }} onClick={() => handleAnnuler(planning.id)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}

                                            {/* CONFIRME */}
                                            {/* ✅ CONFIRME - ASSIGNATION DISPONIBLE AUSSI */}
                                            {planning.statut === 'CONFIRME' && (
                                                <>
                                                    <Tooltip title="Assigner technicien & responsable">
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: '#1976d2', p: 0.5 }}
                                                            onClick={async () => {
                                                                await loadUsers();
                                                                setSelectedForAssign(planning);
                                                                setSelectedTechnicienId('');
                                                                setSelectedResponsableId('');
                                                                setAssignDialogOpen(true);
                                                            }}
                                                        >
                                                            <PersonAdd fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Annuler">
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: '#f44336', p: 0.5 }}
                                                            onClick={() => handleAnnuler(planning.id)}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}

                                            {/* REALISE */}
                                            {planning.statut === 'REALISE' && (
                                                <Tooltip title={planning.pieceIntervention ? "PI déjà attachée" : "Ajouter PI"}>
                                                    <IconButton
                                                        size="small"
                                                        sx={{ color: planning.pieceIntervention ? '#4caf50' : '#ff6f00' }}
                                                        onClick={() => handleUploadPI(planning.id)}
                                                    >
                                                        {planning.pieceIntervention ? <Download fontSize="small" /> : <AttachFile fontSize="small" />}
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Dialog des détails */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EventNote sx={{ color: 'primary.main' }} />
                        <Typography variant="h6">
                            Détails de la visite
                            {selectedPlanning?.statut && (
                                <Chip
                                    label={statusColors[selectedPlanning.statut]?.label || selectedPlanning.statut}
                                    size="small"
                                    sx={{ ml: 1, bgcolor: statusColors[selectedPlanning.statut]?.bg, color: statusColors[selectedPlanning.statut]?.color }}
                                />
                            )}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedPlanning && (
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">N° Visite</Typography>
                                <Typography variant="body1" fontWeight="bold">V{selectedPlanning.numVisite || '?'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">Client</Typography>
                                <Typography variant="body1">{selectedPlanning.clientNom || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">Site</Typography>
                                <Typography variant="body1">{selectedPlanning.siteNom || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">Adresse</Typography>
                                <Typography variant="body1">{selectedPlanning.siteAdresse || 'Non spécifiée'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">Date proposée</Typography>
                                <Typography variant="body1" fontWeight="bold">{formatDate(selectedPlanning.dateProposee)}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">Date confirmée</Typography>
                                <Typography variant="body1">{formatDate(selectedPlanning.dateConfirmee)}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">Date de visite</Typography>
                                <Typography variant="body1">{formatDate(selectedPlanning.dateVisite)}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">Nombre de relances</Typography>
                                <Typography variant="body1">{selectedPlanning.nbRelances || 0}</Typography>
                            </Grid>
                            {selectedPlanning.technicienNom && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="textSecondary">Technicien</Typography>
                                    <Typography variant="body1">{selectedPlanning.technicienNom}</Typography>
                                </Grid>
                            )}
                            {selectedPlanning.responsableNom && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="textSecondary">Responsable</Typography>
                                    <Typography variant="body1">{selectedPlanning.responsableNom}</Typography>
                                </Grid>
                            )}
                            {selectedPlanning.resultat && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="textSecondary">Résultat</Typography>
                                    <Typography variant="body1">{selectedPlanning.resultat}</Typography>
                                </Grid>
                            )}
                            {selectedPlanning.pieceIntervention && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="textSecondary">Pièce jointe</Typography>
                                    <Button size="small" startIcon={<Download />} onClick={() => window.open(`/api/pieces/download/${selectedPlanning.pieceInterventionId}`, '_blank')}>
                                        Télécharger
                                    </Button>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} variant="contained">Fermer</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog d'assignation */}
            <Dialog open={assignDialogOpen} onClose={() => { setAssignDialogOpen(false); setSelectedTechnicienId(''); setSelectedResponsableId(''); }} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonAdd sx={{ color: 'primary.main' }} />
                        <Typography variant="h6">Assigner technicien et responsable</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        Visite V{selectedForAssign?.numVisite} - {selectedForAssign?.clientNom} - {selectedForAssign?.siteNom}
                    </Typography>

                    <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
                        <InputLabel>Choisir un technicien</InputLabel>
                        <Select value={selectedTechnicienId || ''} onChange={(e) => setSelectedTechnicienId(e.target.value)} label="Choisir un technicien">
                            <MenuItem value="">-- Sélectionner --</MenuItem>
                            {techniciens.map((tech) => (
                                <MenuItem key={tech.id} value={tech.id}>{tech.prenom} {tech.nom} - {tech.email}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel>Choisir un responsable</InputLabel>
                        <Select value={selectedResponsableId || ''} onChange={(e) => setSelectedResponsableId(e.target.value)} label="Choisir un responsable">
                            <MenuItem value="">-- Sélectionner --</MenuItem>
                            {responsables.map((resp) => (
                                <MenuItem key={resp.id} value={resp.id}>{resp.prenom} {resp.nom} - {resp.email}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {!loadingUsers && techniciens.length === 0 && responsables.length === 0 && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            <Typography variant="body2">Aucun technicien ou responsable trouvé.</Typography>
                            <Button size="small" color="primary" onClick={async () => { await loadUsers(); }} sx={{ mt: 1 }}>Rafraîchir</Button>
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setAssignDialogOpen(false); setSelectedTechnicienId(''); setSelectedResponsableId(''); }}>Annuler</Button>
                    <Button onClick={handleAssigner} variant="contained" color="primary" startIcon={<PersonAdd />} disabled={!selectedTechnicienId || !selectedResponsableId}>Assigner</Button>
                </DialogActions>
            </Dialog>

            {/* ✅ Dialog de choix de date - UNIQUEMENT POUR REFUSE */}
            <Dialog
                open={relanceDialogOpen}
                onClose={() => {
                    if (!relanceLoading) {
                        setRelanceDialogOpen(false);
                        setDateError('');
                    }
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday sx={{ color: 'primary.main' }} />
                        <Typography variant="h6">Choisir une nouvelle date</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedForRelance && (
                        <>
                            <Box sx={{ mt: 1, mb: 2 }}>
                                <Typography variant="body2" color="textSecondary">
                                    Visite <strong>V{selectedForRelance.numVisite}</strong> - {selectedForRelance.clientNom} - {selectedForRelance.siteNom}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                                    Ancienne date: <strong style={{ color: '#f44336' }}>{formatDate(selectedForRelance.dateProposee)}</strong>
                                </Typography>
                            </Box>

                            {dateError && (
                                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDateError('')}>
                                    {dateError}
                                </Alert>
                            )}

                            <TextField
                                type="date"
                                label="Nouvelle date"
                                value={newDate}
                                onChange={(e) => {
                                    setNewDate(e.target.value);
                                    setDateError('');
                                }}
                                fullWidth
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                                inputProps={{
                                    min: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                                }}
                                sx={{ mt: 1 }}
                            />

                            <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" color="textSecondary">
                                    ⚠️ La date doit être :
                                </Typography>
                                <ul style={{ marginTop: 4, paddingLeft: 20, marginBottom: 0 }}>
                                    <li>Dans le futur</li>
                                    <li>Pas un week-end (samedi ou dimanche)</li>
                                    <li>Pas en août (période de vacances)</li>
                                </ul>
                                <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>
                                    ✅ La date choisie deviendra directement la <strong>date confirmée</strong>
                                </Typography>
                            </Box>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setRelanceDialogOpen(false); setDateError(''); }} disabled={relanceLoading}>Annuler</Button>
                    <Button onClick={handleConfirmRelance} variant="contained" color="primary" disabled={relanceLoading} startIcon={relanceLoading ? <CircularProgress size={20} /> : null}>
                        {relanceLoading ? 'En cours...' : 'Confirmer la date'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PlanningList;