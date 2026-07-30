// components/planning/History.js - Version avec filtre PI
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
    CircularProgress,
    Alert,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Refresh,
    Visibility,
    Download,
    AttachFile,
    EventNote,
    History as HistoryIcon,
    CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';

const statusColors = {
    REALISE: { color: '#6c757d', bg: '#e2e3e5', label: 'Réalisé' },
    ANNULE: { color: '#000000', bg: '#e9ecef', label: 'Annulé' },
};

const History = () => {
    const navigate = useNavigate();
    const [plannings, setPlannings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlanning, setSelectedPlanning] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    // components/planning/History.js - Ajouter les visites ANNULE
// Dans fetchHistory, modifier le filtre :

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/plannings');
            const data = Array.isArray(response.data) ? response.data : [];

            // ✅ Filtrer :
            // - Visites ANNULE (directement dans l'historique)
            // - Visites REALISE AVEC PI
            const historyData = data.filter(p =>
                p.statut === 'ANNULE' ||
                (p.statut === 'REALISE' && p.hasPieceIntervention === true)
            );

            setPlannings(historyData);
        } catch (error) {
            console.error('❌ Erreur:', error);
            setError('Erreur lors du chargement de l\'historique');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (planning) => {
        setSelectedPlanning(planning);
        setDialogOpen(true);
    };

    const handleDownloadPI = (pieceId) => {
        window.open(`/api/pieces/download/${pieceId}`, '_blank');
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
            (p.statut || '').toLowerCase().includes(search)
        );
    });

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Chargement de l'historique...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h4">
                    <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Historique des visites
                    <Chip
                        label={`${filteredPlannings.length} visite(s)`}
                        size="small"
                        sx={{ ml: 2 }}
                    />
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Refresh />}
                    onClick={fetchHistory}
                >
                    Actualiser
                </Button>
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
                    placeholder="Client, site, numéro, statut..."
                />
            </Box>

            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {filteredPlannings.length} visite(s) trouvée(s)
            </Typography>

            {filteredPlannings.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center' }}>
                    <HistoryIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                        Aucune visite dans l'historique
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Les visites terminées apparaîtront ici uniquement après<br/>
                        <strong>l'ajout d'une pièce d'intervention</strong>.
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
                                <TableCell><strong>Date de visite</strong></TableCell>
                                <TableCell><strong>Statut</strong></TableCell>
                                <TableCell><strong>PI</strong></TableCell>
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
                                    <TableCell>
                                        {formatDate(planning.dateVisite || planning.dateConfirmee || planning.dateProposee)}
                                    </TableCell>
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
                                        {planning.hasPieceIntervention ? (
                                            <Chip
                                                label="PI attachée"
                                                size="small"
                                                color="success"
                                                icon={<CheckCircle />}
                                            />
                                        ) : (
                                            <Chip
                                                label="Sans PI"
                                                size="small"
                                                variant="outlined"
                                                sx={{ color: '#ff9800', borderColor: '#ff9800' }}
                                            />
                                        )}
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
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleViewDetails(planning)}
                                                >
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>

                                            {planning.hasPieceIntervention && planning.pieceInterventionId && (
                                                <Tooltip title="Télécharger PI">
                                                    <IconButton
                                                        size="small"
                                                        sx={{ color: '#4caf50' }}
                                                        onClick={() => handleDownloadPI(planning.pieceInterventionId)}
                                                    >
                                                        <Download />
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
                                <Typography variant="body1">{formatDate(selectedPlanning.dateProposee)}</Typography>
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
                                <Typography variant="subtitle2" color="textSecondary">Date de réalisation</Typography>
                                <Typography variant="body1">{formatDate(selectedPlanning.dateRealisation)}</Typography>
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
                            {selectedPlanning.hasPieceIntervention && selectedPlanning.pieceInterventionId && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="textSecondary">Pièce jointe</Typography>
                                    <Button
                                        size="small"
                                        startIcon={<Download />}
                                        onClick={() => handleDownloadPI(selectedPlanning.pieceInterventionId)}
                                        variant="contained"
                                        color="success"
                                    >
                                        Télécharger la PI
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
        </Box>
    );
};

export default History;