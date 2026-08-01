// components/responsable/ResponsableCurrent.js
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, CircularProgress,
    Alert, IconButton, Tooltip, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Snackbar, Avatar,
    TableSortLabel, InputAdornment,
} from '@mui/material';
import { CheckCircle, Refresh, Search, Clear, Work, SupervisorAccount } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

const ResponsableCurrent = () => {
    const { user } = useAuth();
    const [visits, setVisits] = useState([]);
    const [filteredVisits, setFilteredVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [resultat, setResultat] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('asc');

    useEffect(() => {
        fetchVisits();
    }, []);

    useEffect(() => {
        filterAndSortVisits();
    }, [visits, searchTerm, sortBy, sortOrder]);

    const fetchVisits = async () => {
        setLoading(true);
        setError(null);
        try {
            const userId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;
            const response = await api.get(`/plannings/responsable/${userId}`);
            const data = response.data || [];
            const filtered = data.filter(v => v.statut === 'ACCEPTE' || v.statut === 'CONFIRME');
            setVisits(filtered);
        } catch (error) {
            setError('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortVisits = () => {
        let result = [...visits];

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(v =>
                v.clientNom?.toLowerCase().includes(search) ||
                v.siteNom?.toLowerCase().includes(search) ||
                `V${v.numVisite}`.toLowerCase().includes(search)
            );
        }

        result.sort((a, b) => {
            let valA, valB;
            switch (sortBy) {
                case 'date':
                    valA = new Date(a.dateVisite || a.dateConfirmee);
                    valB = new Date(b.dateVisite || b.dateConfirmee);
                    break;
                case 'client':
                    valA = a.clientNom || '';
                    valB = b.clientNom || '';
                    break;
                case 'site':
                    valA = a.siteNom || '';
                    valB = b.siteNom || '';
                    break;
                default:
                    valA = new Date(a.dateVisite || a.dateConfirmee);
                    valB = new Date(b.dateVisite || b.dateConfirmee);
            }
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredVisits(result);
    };

    const handleSort = (field) => {
        setSortBy(field);
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    const handleTerminer = async (visitId) => {
        setSelectedVisit(visits.find(v => v.id === visitId));
        setDialogOpen(true);
    };

    const handleConfirmTerminer = async () => {
        if (!resultat.trim()) {
            setSnackbar({ open: true, message: 'Veuillez saisir un résultat', severity: 'warning' });
            return;
        }

        try {
            await api.post(`/plannings/realiser/${selectedVisit.id}?resultat=${encodeURIComponent(resultat)}`);
            setSnackbar({ open: true, message: '✅ Visite terminée avec succès !', severity: 'success' });
            setDialogOpen(false);
            setResultat('');
            fetchVisits();
        } catch (error) {
            setSnackbar({ open: true, message: '❌ Erreur lors de la mise à jour', severity: 'error' });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2, color: 'text.secondary' }}>Chargement...</Typography>
        </Box>
    );

    if (error) return (
        <Box sx={{ p: 3 }}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
        </Box>
    );

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
                    <Avatar sx={{ bgcolor: '#ed6c02', width: 40, height: 40 }}>
                        <SupervisorAccount sx={{ color: 'white' }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                            👔 Mes visites en cours
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {filteredVisits.length} visite(s)
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={fetchVisits}
                    size="small"
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                    Actualiser
                </Button>
            </Paper>

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
                    flexWrap: 'wrap',
                }}
            >
                <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                <TextField
                    size="small"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ flexGrow: 1, minWidth: 150 }}
                    InputProps={{
                        endAdornment: searchTerm && (
                            <IconButton size="small" onClick={() => setSearchTerm('')}>
                                <Clear fontSize="small" />
                            </IconButton>
                        ),
                        sx: { borderRadius: 2, height: 38 }
                    }}
                />
            </Paper>

            {/* Table */}
            {filteredVisits.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
                    <Typography color="text.secondary">
                        {searchTerm ? 'Aucun résultat' : 'Aucune visite en cours'}
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e8ecf1' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                <TableCell>
                                    <TableSortLabel
                                        active={sortBy === 'visite'}
                                        direction={sortOrder}
                                        onClick={() => handleSort('visite')}
                                        sx={{ fontWeight: 600 }}
                                    >
                                        N°
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={sortBy === 'client'}
                                        direction={sortOrder}
                                        onClick={() => handleSort('client')}
                                        sx={{ fontWeight: 600 }}
                                    >
                                        Client
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={sortBy === 'site'}
                                        direction={sortOrder}
                                        onClick={() => handleSort('site')}
                                        sx={{ fontWeight: 600 }}
                                    >
                                        Site
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={sortBy === 'date'}
                                        direction={sortOrder}
                                        onClick={() => handleSort('date')}
                                        sx={{ fontWeight: 600 }}
                                    >
                                        Date
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredVisits.map((v) => (
                                <TableRow key={v.id} hover>
                                    <TableCell>
                                        <Chip
                                            label={`V${v.numVisite}`}
                                            size="small"
                                            variant="outlined"
                                            sx={{ borderRadius: 1, height: 24, fontSize: '0.75rem' }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem' }}>{v.clientNom || 'N/A'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem' }}>{v.siteNom || 'N/A'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem' }}>{formatDate(v.dateVisite || v.dateConfirmee)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={v.statut}
                                            size="small"
                                            color={v.statut === 'ACCEPTE' ? 'success' : 'primary'}
                                            sx={{ borderRadius: 1, height: 24, fontSize: '0.7rem', fontWeight: 500 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Marquer comme terminée">
                                            <IconButton
                                                size="small"
                                                color="success"
                                                onClick={() => handleTerminer(v.id)}
                                                sx={{
                                                    bgcolor: 'success.light',
                                                    '&:hover': { bgcolor: 'success.main', color: 'white' }
                                                }}
                                            >
                                                <CheckCircle fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle sx={{ color: 'success.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Terminer la visite</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedVisit && (
                        <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Visite V{selectedVisit.numVisite} - {selectedVisit.clientNom} - {selectedVisit.siteNom}
                            </Typography>
                            <TextField
                                label="Résultat de la visite"
                                multiline
                                rows={4}
                                fullWidth
                                value={resultat}
                                onChange={(e) => setResultat(e.target.value)}
                                placeholder="Décrivez le résultat de la visite..."
                                size="small"
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDialogOpen(false)} size="small" sx={{ borderRadius: 2, textTransform: 'none' }}>
                        Annuler
                    </Button>
                    <Button onClick={handleConfirmTerminer} variant="contained" color="success" size="small" sx={{ borderRadius: 2, textTransform: 'none' }}>
                        Terminer
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ResponsableCurrent;