// components/planning/PlanningList.js - COMPLET FINAL avec gestion REFUSE
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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';

const statusColors = {
    EN_ATTENTE: { color: '#ff9800', bg: '#fff3cd', label: 'En attente' },
    ACCEPTE: { color: '#4caf50', bg: '#d4edda', label: 'Accepté' },
    REFUSE: { color: '#f44336', bg: '#f8d7da', label: 'Refusé' },
    RELANCE: { color: '#ff6f00', bg: '#fff3cd', label: 'Relancé' },
    CONFIRME: { color: '#1976d2', bg: '#cce5ff', label: 'Confirmé' },
    REALISE: { color: '#6c757d', bg: '#e2e3e5', label: 'Réalisé' },
    ANNULE: { color: '#000000', bg: '#e9ecef', label: 'Annulé' },
};

const PlanningList = () => {
    const navigate = useNavigate();
    const [plannings, setPlannings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlanning, setSelectedPlanning] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    // States pour l'assignation
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedForAssign, setSelectedForAssign] = useState(null);
    const [techniciens, setTechniciens] = useState([]);
    const [responsables, setResponsables] = useState([]);
    const [selectedTechnicienId, setSelectedTechnicienId] = useState('');
    const [selectedResponsableId, setSelectedResponsableId] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        fetchPlannings();
    }, [filter]);

    useEffect(() => {
        fetchTechniciensEtResponsables();
    }, []);

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
            const data = Array.isArray(response.data) ? response.data : [];
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
            console.log('🔍 Récupération de tous les utilisateurs...');
            const response = await api.get('/utilisateurs');
            console.log('📋 Données reçues:', response.data);

            const allUsers = Array.isArray(response.data) ? response.data : [];
            console.log(`📋 ${allUsers.length} utilisateur(s) trouvé(s)`);

            const techs = allUsers.filter(u =>
                u.actif === true &&
                (u.role === 'TECHNICIEN_HARDWARE' || u.role === 'TECHNICEN_HARDWARE')
            );

            const resp = allUsers.filter(u =>
                u.actif === true &&
                u.role === 'RESPONSABLE_SOFTWARE'
            );

            console.log('✅ Techniciens filtrés:', techs);
            console.log('✅ Responsables filtrés:', resp);

            setTechniciens(techs);
            setResponsables(resp);

            console.log(`📊 ${techs.length} technicien(s), ${resp.length} responsable(s)`);

        } catch (error) {
            console.error('❌ Erreur:', error);
            console.error('❌ Response:', error.response);
            alert('Erreur lors du chargement des utilisateurs. Vérifiez la console.');
        } finally {
            setLoadingUsers(false);
        }
    };

    // ✅ ADMIN - Accepter une visite
    const handleAccepter = async (planningId) => {
        if (!window.confirm('Confirmer l\'acceptation de cette visite ?')) {
            return;
        }

        try {
            await api.post(`/plannings/reponse/${planningId}?accepte=true`);
            alert('✅ Visite acceptée avec succès !');
            fetchPlannings();
        } catch (error) {
            console.error('❌ Erreur:', error);
            alert('❌ Erreur lors du traitement');
        }
    };

    // ✅ ADMIN - Annuler une visite (suppression définitive)
    const handleAnnuler = async (planningId) => {
        if (!window.confirm('Confirmer l\'annulation définitive de cette visite ?')) {
            return;
        }

        try {
            await api.post(`/plannings/annuler/${planningId}`);
            alert('✅ Visite annulée avec succès !');
            fetchPlannings();
        } catch (error) {
            console.error('❌ Erreur:', error);
            alert('❌ Erreur lors de l\'annulation');
        }
    };

    // ✅ ADMIN - Relancer une visite (pour EN_ATTENTE)
    const handleRelance = async (planningId) => {
        if (!window.confirm('Envoyer une relance pour cette visite ?')) {
            return;
        }

        try {
            await api.post(`/plannings/relance/${planningId}`);
            alert('✅ Relance envoyée avec succès !');
            fetchPlannings();
        } catch (error) {
            console.error('❌ Erreur:', error);
            alert('❌ Erreur lors de l\'envoi de la relance');
        }
    };

    // ✅ ADMIN - Relancer une visite refusée (nouvelle proposition)
    const handleRelancerVisite = async (planningId) => {
        if (!window.confirm('Envoyer une nouvelle proposition pour cette visite refusée ?')) {
            return;
        }

        try {
            await api.post(`/plannings/relancer/${planningId}`);
            alert('✅ Nouvelle proposition envoyée avec succès !');
            fetchPlannings();
        } catch (error) {
            console.error('❌ Erreur:', error);
            alert('❌ Erreur lors de la relance');
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
            console.log(`✅ ${techs.length} technicien(s) et ${resp.length} responsable(s) chargés`);
        } catch (error) {
            console.error('❌ Erreur lors du chargement:', error);
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
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h4">📋 Planning des Visites</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        startIcon={<Refresh />}
                        onClick={fetchPlannings}
                    >
                        Actualiser
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <TextField
                    label="Rechercher..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ flexGrow: 1, minWidth: 200 }}
                    placeholder="Client, site, numéro, statut, technicien, responsable..."
                />
                <TextField
                    select
                    label="Filtrer par statut"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    size="small"
                    sx={{ minWidth: 150 }}
                >
                    <MenuItem value="">Tous</MenuItem>
                    {Object.entries(statusColors).map(([key, value]) => (
                        <MenuItem key={key} value={key}>
                            <Chip
                                label={value.label}
                                size="small"
                                sx={{ bgcolor: value.bg, color: value.color }}
                            />
                        </MenuItem>
                    ))}
                </TextField>
                <Button variant="outlined" onClick={() => { setFilter(''); setSearchTerm(''); }}>
                    Réinitialiser
                </Button>
            </Box>

            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {filteredPlannings.length} visite(s) trouvée(s) sur {plannings.length}
            </Typography>

            {filteredPlannings.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="textSecondary">
                        {plannings.length === 0 ? 'Aucune visite trouvée' : 'Aucune visite ne correspond aux filtres'}
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                <TableCell><strong>N° Visite</strong></TableCell>
                                <TableCell><strong>Client</strong></TableCell>
                                <TableCell><strong>Site</strong></TableCell>
                                <TableCell><strong>Date proposée</strong></TableCell>
                                <TableCell><strong>Date confirmée</strong></TableCell>
                                <TableCell><strong>Statut</strong></TableCell>
                                <TableCell><strong>Technicien</strong></TableCell>
                                <TableCell><strong>Responsable</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredPlannings.map((planning) => (
                                <TableRow key={planning.id} hover>
                                    <TableCell>
                                        <Chip
                                            label={`V${planning.numVisite || '?'}`}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>{planning.clientNom || 'N/A'}</TableCell>
                                    <TableCell>{planning.siteNom || 'N/A'}</TableCell>
                                    <TableCell>{formatDate(planning.dateProposee)}</TableCell>
                                    <TableCell>{formatDate(planning.dateConfirmee)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={statusColors[planning.statut]?.label || planning.statut || 'N/A'}
                                            size="small"
                                            sx={{
                                                bgcolor: statusColors[planning.statut]?.bg || '#e9ecef',
                                                color: statusColors[planning.statut]?.color || '#000',
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {planning.technicienNom ?
                                            planning.technicienNom :
                                            <Chip label="Non assigné" size="small" variant="outlined" />
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {planning.responsableNom ?
                                            planning.responsableNom :
                                            <Chip label="Non assigné" size="small" variant="outlined" />
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                            <Tooltip title="Voir détails">
                                                <IconButton size="small" onClick={() => handleViewDetails(planning)}>
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>

                                            {/* ✅ ADMIN - Actions pour les visites en attente */}
                                            {planning.statut === 'EN_ATTENTE' && (
                                                <>
                                                    <Tooltip title="Accepter la visite">
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: '#4caf50' }}
                                                            onClick={() => handleAccepter(planning.id)}
                                                        >
                                                            <CheckCircle />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Annuler définitivement la visite">
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: '#f44336' }}
                                                            onClick={() => handleAnnuler(planning.id)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Envoyer une relance">
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: '#ff9800' }}
                                                            onClick={() => handleRelance(planning.id)}
                                                        >
                                                            <Email />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}

                                            {/* ✅ ADMIN - Actions pour les visites refusées */}
                                            {planning.statut === 'REFUSE' && (
                                                <>
                                                    <Tooltip title="Relancer la visite (nouvelle proposition)">
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: '#ff9800' }}
                                                            onClick={() => handleRelancerVisite(planning.id)}
                                                        >
                                                            <Email />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Annuler définitivement la visite">
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: '#f44336' }}
                                                            onClick={() => handleAnnuler(planning.id)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}

                                            {/* ✅ ADMIN - Actions pour les visites acceptées */}
                                            {planning.statut === 'ACCEPTE' && (
                                                <Tooltip title="Assigner technicien & responsable">
                                                    <IconButton
                                                        size="small"
                                                        sx={{ color: '#1976d2' }}
                                                        onClick={async () => {
                                                            await loadUsers();
                                                            setSelectedForAssign(planning);
                                                            setSelectedTechnicienId('');
                                                            setSelectedResponsableId('');
                                                            setAssignDialogOpen(true);
                                                        }}
                                                    >
                                                        <PersonAdd />
                                                    </IconButton>
                                                </Tooltip>
                                            )}

                                            {/* ✅ ADMIN - Actions pour les visites relancées */}
                                            {planning.statut === 'RELANCE' && (
                                                <>
                                                    <Tooltip title="Accepter la visite">
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: '#4caf50' }}
                                                            onClick={() => handleAccepter(planning.id)}
                                                        >
                                                            <CheckCircle />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Annuler définitivement la visite">
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: '#f44336' }}
                                                            onClick={() => handleAnnuler(planning.id)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Assigner technicien & responsable">
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: '#1976d2' }}
                                                            onClick={async () => {
                                                                await loadUsers();
                                                                setSelectedForAssign(planning);
                                                                setSelectedTechnicienId('');
                                                                setSelectedResponsableId('');
                                                                setAssignDialogOpen(true);
                                                            }}
                                                        >
                                                            <PersonAdd />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}

                                            {/* ✅ Upload PI pour les visites réalisées */}
                                            {planning.statut === 'REALISE' && (
                                                <Tooltip title={planning.pieceIntervention ? "PI déjà attachée" : "Ajouter une pièce jointe"}>
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            color: planning.pieceIntervention ? '#4caf50' : '#ff6f00'
                                                        }}
                                                        onClick={() => handleUploadPI(planning.id)}
                                                    >
                                                        {planning.pieceIntervention ? <Download /> : <AttachFile />}
                                                    </IconButton>
                                                </Tooltip>
                                            )}

                                            <Tooltip title="Voir historique">
                                                <IconButton size="small" sx={{ color: '#6c757d' }}>
                                                    <History />
                                                </IconButton>
                                            </Tooltip>
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
                                    sx={{
                                        ml: 1,
                                        bgcolor: statusColors[selectedPlanning.statut]?.bg,
                                        color: statusColors[selectedPlanning.statut]?.color,
                                    }}
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
                                <Typography variant="body1" fontWeight="bold">
                                    V{selectedPlanning.numVisite || '?'}
                                </Typography>
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
                                <Typography variant="body1" fontWeight="bold">
                                    {formatDate(selectedPlanning.dateProposee)}
                                </Typography>
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
                                    <Button
                                        size="small"
                                        startIcon={<Download />}
                                        onClick={() => window.open(`/api/pieces/download/${selectedPlanning.pieceInterventionId}`, '_blank')}
                                    >
                                        Télécharger
                                    </Button>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} variant="contained">
                        Fermer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog d'assignation technicien + responsable */}
            <Dialog
                open={assignDialogOpen}
                onClose={() => {
                    setAssignDialogOpen(false);
                    setSelectedTechnicienId('');
                    setSelectedResponsableId('');
                }}
                maxWidth="sm"
                fullWidth
            >
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
                        <Select
                            value={selectedTechnicienId || ''}
                            onChange={(e) => setSelectedTechnicienId(e.target.value)}
                            label="Choisir un technicien"
                            onOpen={async () => {
                                console.log('🔍 CHARGEMENT DES TECHNICIENS...');
                                if (techniciens.length === 0) {
                                    setLoadingUsers(true);
                                    try {
                                        const response = await api.get('/utilisateurs');
                                        const allUsers = Array.isArray(response.data) ? response.data : [];
                                        const techs = allUsers.filter(u =>
                                            u.actif === true &&
                                            (u.role === 'TECHNICIEN_HARDWARE' || u.role === 'TECHNICEN_HARDWARE')
                                        );
                                        setTechniciens(techs);
                                        console.log('✅ Techniciens chargés:', techs);
                                    } catch (error) {
                                        console.error('❌ Erreur:', error);
                                    } finally {
                                        setLoadingUsers(false);
                                    }
                                }
                            }}
                        >
                            <MenuItem value="">-- Sélectionner --</MenuItem>
                            {loadingUsers ? (
                                <MenuItem disabled>Chargement...</MenuItem>
                            ) : techniciens.length === 0 ? (
                                <MenuItem disabled>Aucun technicien disponible</MenuItem>
                            ) : (
                                techniciens.map((tech) => (
                                    <MenuItem key={tech.id} value={tech.id}>
                                        {tech.prenom} {tech.nom} - {tech.email}
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel>Choisir un responsable</InputLabel>
                        <Select
                            value={selectedResponsableId || ''}
                            onChange={(e) => setSelectedResponsableId(e.target.value)}
                            label="Choisir un responsable"
                            onOpen={async () => {
                                console.log('🔍 CHARGEMENT DES RESPONSABLES...');
                                if (responsables.length === 0) {
                                    setLoadingUsers(true);
                                    try {
                                        const response = await api.get('/utilisateurs');
                                        const allUsers = Array.isArray(response.data) ? response.data : [];
                                        const resp = allUsers.filter(u =>
                                            u.actif === true &&
                                            u.role === 'RESPONSABLE_SOFTWARE'
                                        );
                                        setResponsables(resp);
                                        console.log('✅ Responsables chargés:', resp);
                                    } catch (error) {
                                        console.error('❌ Erreur:', error);
                                    } finally {
                                        setLoadingUsers(false);
                                    }
                                }
                            }}
                        >
                            <MenuItem value="">-- Sélectionner --</MenuItem>
                            {loadingUsers ? (
                                <MenuItem disabled>Chargement...</MenuItem>
                            ) : responsables.length === 0 ? (
                                <MenuItem disabled>Aucun responsable disponible</MenuItem>
                            ) : (
                                responsables.map((resp) => (
                                    <MenuItem key={resp.id} value={resp.id}>
                                        {resp.prenom} {resp.nom} - {resp.email}
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                    </FormControl>

                    {loadingUsers && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <CircularProgress size={24} />
                            <Typography sx={{ ml: 1 }}>Chargement des utilisateurs...</Typography>
                        </Box>
                    )}

                    {!loadingUsers && techniciens.length === 0 && responsables.length === 0 && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                                Aucun technicien ou responsable trouvé.
                            </Typography>
                            <Button
                                size="small"
                                color="primary"
                                onClick={async () => {
                                    await loadUsers();
                                }}
                                sx={{ mt: 1 }}
                            >
                                Rafraîchir
                            </Button>
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setAssignDialogOpen(false);
                            setSelectedTechnicienId('');
                            setSelectedResponsableId('');
                        }}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleAssigner}
                        variant="contained"
                        color="primary"
                        startIcon={<PersonAdd />}
                        disabled={!selectedTechnicienId || !selectedResponsableId || loadingUsers}
                    >
                        Assigner
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PlanningList;