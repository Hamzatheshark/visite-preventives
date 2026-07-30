// components/interventions/PieceInterventionList.js - Version corrigée
import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    Tooltip,
    TextField,
    InputAdornment,
} from '@mui/material';
import {
    CloudUpload,
    Download,
    Delete,
    Visibility,
    Refresh,
    Search,
    Clear,
    CheckCircle,
    Cancel,
    AttachFile,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';

const statusColors = {
    REALISE: { color: '#6c757d', bg: '#e2e3e5', label: 'Réalisé' },
};

const PieceInterventionList = () => {
    const navigate = useNavigate();
    const [visites, setVisites] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVisite, setSelectedVisite] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [visiteToDelete, setVisiteToDelete] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchVisitesRealisees();
    }, []);

    // ✅ Récupérer UNIQUEMENT les visites REALISE (avec ou sans PI)
    const fetchVisitesRealisees = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/plannings/statut/REALISE');
            const data = Array.isArray(response.data) ? response.data : [];
            setVisites(data);
        } catch (error) {
            console.error('❌ Erreur:', error);
            setError('Erreur lors du chargement des visites réalisées');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = (planningId) => {
        navigate(`/upload-pi/${planningId}`);
    };

    const handleDownload = (pieceId) => {
        window.open(`/api/pieces/download/${pieceId}`, '_blank');
    };

    const handleViewDetails = (visite) => {
        setSelectedVisite(visite);
        setDialogOpen(true);
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const filteredVisites = visites.filter(v => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            (v.clientNom || '').toLowerCase().includes(search) ||
            (v.siteNom || '').toLowerCase().includes(search) ||
            (v.numVisite ? `v${v.numVisite}` : '').includes(search)
        );
    });

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Chargement des visites réalisées...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h4">
                    📎 Pièces d'Intervention
                    <Chip
                        label={`${filteredVisites.length} visite(s) réalisée(s)`}
                        size="small"
                        sx={{ ml: 2 }}
                    />
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={fetchVisitesRealisees}
                >
                    Actualiser
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Search sx={{ color: 'text.secondary' }} />
                    <TextField
                        label="Rechercher..."
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
                </Box>
            </Paper>

            {filteredVisites.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center' }}>
                    <CheckCircle sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                        Aucune visite réalisée
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Les visites apparaîtront ici une fois marquées comme "Réalisées".
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
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredVisites.map((visite) => (
                                <TableRow key={visite.id} hover>
                                    <TableCell>
                                        <Chip
                                            label={`V${visite.numVisite || '?'}`}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>{visite.clientNom || 'N/A'}</TableCell>
                                    <TableCell>{visite.siteNom || 'N/A'}</TableCell>
                                    <TableCell>{formatDate(visite.dateVisite)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label="Réalisé"
                                            size="small"
                                            sx={{
                                                bgcolor: statusColors.REALISE.bg,
                                                color: statusColors.REALISE.color,
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {visite.hasPieceIntervention ? (
                                            <Chip
                                                label="✅ PI attachée"
                                                size="small"
                                                color="success"
                                                icon={<CheckCircle />}
                                            />
                                        ) : (
                                            <Chip
                                                label="⚠️ PI manquante"
                                                size="small"
                                                color="warning"
                                                icon={<AttachFile />}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="Voir détails">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleViewDetails(visite)}
                                                >
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>

                                            {visite.hasPieceIntervention && visite.pieceInterventionId ? (
                                                <Tooltip title="Télécharger PI">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleDownload(visite.pieceInterventionId)}
                                                    >
                                                        <Download />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title="Ajouter une PI">
                                                    <IconButton
                                                        size="small"
                                                        color="warning"
                                                        onClick={() => handleUpload(visite.id)}
                                                    >
                                                        <AttachFile />
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

            {/* Dialog Détails */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Visibility sx={{ color: 'primary.main' }} />
                        <Typography variant="h6">Détails de la visite</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedVisite && (
                        <Box>
                            <Typography variant="subtitle2" color="textSecondary">N° Visite</Typography>
                            <Typography variant="body1" gutterBottom>
                                V{selectedVisite.numVisite || '?'}
                            </Typography>

                            <Typography variant="subtitle2" color="textSecondary">Client</Typography>
                            <Typography variant="body1" gutterBottom>
                                {selectedVisite.clientNom || 'N/A'}
                            </Typography>

                            <Typography variant="subtitle2" color="textSecondary">Site</Typography>
                            <Typography variant="body1" gutterBottom>
                                {selectedVisite.siteNom || 'N/A'}
                            </Typography>

                            <Typography variant="subtitle2" color="textSecondary">Date de visite</Typography>
                            <Typography variant="body1" gutterBottom>
                                {formatDate(selectedVisite.dateVisite)}
                            </Typography>

                            <Typography variant="subtitle2" color="textSecondary">Statut</Typography>
                            <Chip
                                label="Réalisé"
                                size="small"
                                sx={{
                                    bgcolor: statusColors.REALISE.bg,
                                    color: statusColors.REALISE.color,
                                }}
                            />

                            <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>
                                Pièce d'intervention
                            </Typography>
                            {selectedVisite.hasPieceIntervention && selectedVisite.pieceInterventionId ? (
                                <Button
                                    size="small"
                                    startIcon={<Download />}
                                    onClick={() => handleDownload(selectedVisite.pieceInterventionId)}
                                    variant="contained"
                                    color="success"
                                >
                                    Télécharger la PI
                                </Button>
                            ) : (
                                <Button
                                    size="small"
                                    startIcon={<AttachFile />}
                                    onClick={() => handleUpload(selectedVisite.id)}
                                    variant="contained"
                                    color="warning"
                                >
                                    Ajouter une PI
                                </Button>
                            )}
                        </Box>
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

export default PieceInterventionList;