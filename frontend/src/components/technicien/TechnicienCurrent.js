// components/technicien/TechnicienCurrent.js
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, CircularProgress,
    Alert, IconButton, Tooltip, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Snackbar
} from '@mui/material';
import { CheckCircle, Refresh } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

const TechnicienCurrent = () => {
    const { user } = useAuth();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [resultat, setResultat] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchVisits();
    }, []);

    const fetchVisits = async () => {
        setLoading(true);
        setError(null);
        try {
            const userId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;
            const response = await api.get(`/plannings/technicien/${userId}`);
            const data = response.data || [];
            const filtered = data.filter(v => v.statut === 'ACCEPTE' || v.statut === 'CONFIRME');
            setVisits(filtered);
        } catch (error) {
            setError('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
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

    if (loading) return <CircularProgress sx={{ m: 5 }} />;
    if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">🔧 Mes visites en cours</Typography>
                <Button variant="outlined" startIcon={<Refresh />} onClick={fetchVisits} size="small">
                    Actualiser
                </Button>
            </Box>

            {visits.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="textSecondary">Aucune visite en cours</Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                <TableCell><strong>N°</strong></TableCell>
                                <TableCell><strong>Client</strong></TableCell>
                                <TableCell><strong>Site</strong></TableCell>
                                <TableCell><strong>Date</strong></TableCell>
                                <TableCell><strong>Statut</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {visits.map((v) => (
                                <TableRow key={v.id} hover>
                                    <TableCell>
                                        <Chip label={`V${v.numVisite}`} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell>{v.clientNom || 'N/A'}</TableCell>
                                    <TableCell>{v.siteNom || 'N/A'}</TableCell>
                                    <TableCell>
                                        {new Date(v.dateVisite || v.dateConfirmee).toLocaleDateString('fr-FR')}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={v.statut}
                                            size="small"
                                            color={v.statut === 'ACCEPTE' ? 'success' : 'primary'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="Marquer comme terminée">
                                            <IconButton
                                                size="small"
                                                color="success"
                                                onClick={() => handleTerminer(v.id)}
                                            >
                                                <CheckCircle />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Dialog pour terminer la visite */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle sx={{ color: 'success.main' }} />
                        <Typography variant="h6">Terminer la visite</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedVisit && (
                        <>
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
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
                                sx={{ mt: 2 }}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
                    <Button onClick={handleConfirmTerminer} variant="contained" color="success">
                        Terminer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar pour les notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default TechnicienCurrent;