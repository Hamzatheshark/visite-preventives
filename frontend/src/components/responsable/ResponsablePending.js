// components/responsable/ResponsablePending.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Alert, IconButton, Tooltip } from '@mui/material';
import { CheckCircle, Cancel, Email } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

const ResponsablePending = () => {
    const { user } = useAuth();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchVisits();
    }, []);

    const fetchVisits = async () => {
        setLoading(true);
        try {
            const userId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;
            const response = await api.get(`/plannings/responsable/${userId}`);
            const data = response.data || [];
            const filtered = data.filter(v => v.statut === 'EN_ATTENTE' || v.statut === 'RELANCE');
            setVisits(filtered);
        } catch (error) {
            setError('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    const handleReponse = async (id, accepte) => {
        try {
            await api.post(`/plannings/reponse/${id}?accepte=${accepte}`);
            fetchVisits();
        } catch (error) {
            alert('Erreur');
        }
    };

    const handleRelance = async (id) => {
        try {
            await api.post(`/plannings/relance/${id}`);
            fetchVisits();
        } catch (error) {
            alert('Erreur');
        }
    };

    if (loading) return <CircularProgress sx={{ m: 5 }} />;
    if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>⏳ Mes visites en attente</Typography>
            {visits.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="textSecondary">Aucune visite en attente</Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                <TableCell>N°</TableCell>
                                <TableCell>Client</TableCell>
                                <TableCell>Site</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Statut</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {visits.map((v) => (
                                <TableRow key={v.id}>
                                    <TableCell>V{v.numVisite}</TableCell>
                                    <TableCell>{v.clientNom}</TableCell>
                                    <TableCell>{v.siteNom}</TableCell>
                                    <TableCell>{new Date(v.dateProposee).toLocaleDateString('fr-FR')}</TableCell>
                                    <TableCell>
                                        <Chip label={v.statut} size="small" color="warning" />
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="Accepter">
                                            <IconButton size="small" color="success" onClick={() => handleReponse(v.id, true)}>
                                                <CheckCircle />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Refuser">
                                            <IconButton size="small" color="error" onClick={() => handleReponse(v.id, false)}>
                                                <Cancel />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Relancer">
                                            <IconButton size="small" color="warning" onClick={() => handleRelance(v.id)}>
                                                <Email />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default ResponsablePending;