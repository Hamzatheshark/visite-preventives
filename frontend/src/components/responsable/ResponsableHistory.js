// components/responsable/ResponsableHistory.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

const ResponsableHistory = () => {
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
            const filtered = data.filter(v => v.statut === 'REALISE' || v.statut === 'ANNULE');
            setVisits(filtered);
        } catch (error) {
            setError('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <CircularProgress sx={{ m: 5 }} />;
    if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>📜 Mon historique</Typography>
            {visits.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="textSecondary">Aucun historique</Typography>
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
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {visits.map((v) => (
                                <TableRow key={v.id}>
                                    <TableCell>V{v.numVisite}</TableCell>
                                    <TableCell>{v.clientNom}</TableCell>
                                    <TableCell>{v.siteNom}</TableCell>
                                    <TableCell>{new Date(v.dateVisite || v.dateConfirmee).toLocaleDateString('fr-FR')}</TableCell>
                                    <TableCell>
                                        <Chip label={v.statut} size="small" color={v.statut === 'REALISE' ? 'success' : 'default'} />
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

export default ResponsableHistory;