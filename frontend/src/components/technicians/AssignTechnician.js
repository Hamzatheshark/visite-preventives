import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import { PersonAdd, Refresh } from '@mui/icons-material';
import api from '../../api/axiosConfig';

const AssignTechnician = () => {
    const [visits, setVisits] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [visitsRes, techsRes] = await Promise.all([
                api.get('/plannings/statut/EN_ATTENTE'),
                api.get('/utilisateurs')
            ]);

            const allVisits = Array.isArray(visitsRes.data) ? visitsRes.data : [];
            setVisits(allVisits);

            const allUsers = Array.isArray(techsRes.data) ? techsRes.data : [];
            const techs = allUsers.filter(u => u.role === 'TECHNICIEN_HARDWARE' && u.actif);
            setTechnicians(techs);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (visitId, technicianId) => {
        try {
            await api.post(`/plannings/assigner-technicien/${visitId}?technicienId=${technicianId}`);
            setSuccess('Technicien assigné avec succès');
            fetchData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Error assigning technician:', error);
            setError('Erreur lors de l\'assignation');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Affectation des techniciens</Typography>
                <Button variant="outlined" startIcon={<Refresh />} onClick={fetchData}>
                    Actualiser
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Visite ID</TableCell>
                            <TableCell>Client</TableCell>
                            <TableCell>Site</TableCell>
                            <TableCell>Date proposée</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell>Technicien actuel</TableCell>
                            <TableCell>Assigner</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {visits.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    Aucune visite en attente d'assignation
                                </TableCell>
                            </TableRow>
                        ) : (
                            visits.map((visit) => (
                                <TableRow key={visit.id}>
                                    <TableCell>{visit.id}</TableCell>
                                    <TableCell>{visit.site?.client?.nom || 'N/A'}</TableCell>
                                    <TableCell>{visit.site?.nom || 'N/A'}</TableCell>
                                    <TableCell>{visit.dateProposee}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label="En attente"
                                            color="warning"
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {visit.technicien?.nom || 'Non assigné'}
                                    </TableCell>
                                    <TableCell>
                                        <FormControl size="small" sx={{ minWidth: 150 }}>
                                            <Select
                                                value={visit.technicien?.id || ''}
                                                onChange={(e) => handleAssign(visit.id, e.target.value)}
                                                displayEmpty
                                            >
                                                <MenuItem value="">Sélectionner</MenuItem>
                                                {technicians.map((tech) => (
                                                    <MenuItem key={tech.id} value={tech.id}>
                                                        {tech.prenom} {tech.nom}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AssignTechnician;