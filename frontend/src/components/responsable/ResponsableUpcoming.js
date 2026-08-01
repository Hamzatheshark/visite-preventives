// components/responsable/ResponsableUpcoming.js
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, CircularProgress,
    Alert, IconButton, Tooltip, Button, Snackbar
} from '@mui/material';
import { PersonOff, Refresh } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

const ResponsableUpcoming = () => {
    const { user } = useAuth();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchVisits();
    }, []);

    const fetchVisits = async () => {
        setLoading(true);
        setError(null);
        try {
            const userId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;
            const response = await api.get(`/plannings/responsable/${userId}`);
            const data = response.data || [];
            // ✅ Filtrer les visites à venir (ACCEPTE ou CONFIRME)
            const filtered = data.filter(v => v.statut === 'ACCEPTE' || v.statut === 'CONFIRME');
            setVisits(filtered);
        } catch (error) {
            console.error('❌ Erreur:', error);
            setError('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    const handleAnnulerAssignment = async (visitId) => {
        if (!window.confirm('Confirmer l\'annulation de votre assignement pour cette visite ?')) return;

        try {
            await api.post(`/plannings/${visitId}/annuler-assignment-responsable`);
            setSnackbar({ open: true, message: '✅ Assignement annulé avec succès !', severity: 'success' });
            fetchVisits();
        } catch (error) {
            setSnackbar({ open: true, message: '❌ Erreur lors de l\'annulation', severity: 'error' });
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
                <Typography variant="h4">📋 Mes visites à venir</Typography>
                <Button variant="outlined" startIcon={<Refresh />} onClick={fetchVisits} size="small">
                    Actualiser
                </Button>
            </Box>

            {visits.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="textSecondary">Aucune visite à venir</Typography>
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
                                <TableCell align="center"><strong>Actions</strong></TableCell>
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
                                    <TableCell align="center">
                                        <Tooltip title="Annuler mon assignement">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleAnnulerAssignment(v.id)}
                                            >
                                                <PersonOff />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

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

export default ResponsableUpcoming;