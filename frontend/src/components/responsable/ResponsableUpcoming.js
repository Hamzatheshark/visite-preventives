// components/responsable/ResponsableUpcoming.js - Version avec logs
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, CircularProgress,
    Alert, Button, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { ExpandMore, Refresh } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

const ResponsableUpcoming = () => {
    const { user } = useAuth();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [debugInfo, setDebugInfo] = useState(null);

    useEffect(() => {
        fetchVisits();
    }, []);

    const fetchVisits = async () => {
        setLoading(true);
        setError(null);
        try {
            // Récupérer l'ID de l'utilisateur
            let userId = user?.id;
            let userRole = user?.role;

            if (!userId) {
                const stored = localStorage.getItem('user');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    userId = parsed?.id;
                    userRole = parsed?.role;
                }
            }

            console.log('🔍 Informations utilisateur:', { userId, userRole });

            if (!userId) {
                setError('Utilisateur non identifié. Veuillez vous reconnecter.');
                setLoading(false);
                return;
            }

            // Vérifier le rôle de l'utilisateur
            const roleResponse = await api.get(`/utilisateurs/${userId}/role`);
            console.log('📋 Rôle utilisateur:', roleResponse.data);
            setDebugInfo(roleResponse.data);

            // Récupérer les visites du responsable
            const response = await api.get(`/plannings/responsable/${userId}`);
            console.log('📋 Données reçues:', response.data);

            const data = response.data || [];

            // Filtrer les visites à venir
            const filtered = data.filter(v =>
                v.statut === 'ACCEPTE' || v.statut === 'CONFIRME'
            );

            console.log('✅ Visites filtrées (à venir):', filtered.length);
            setVisits(filtered);
        } catch (error) {
            console.error('❌ Erreur:', error);
            console.error('❌ Response:', error.response);

            if (error.response?.status === 404) {
                setError('Endpoint non trouvé. Vérifiez que l\'API /plannings/responsable/{id} existe.');
            } else if (error.response?.status === 500) {
                setError('Erreur serveur. Vérifiez les logs du backend.');
            } else {
                setError(`Erreur: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Chargement de vos visites...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button variant="contained" startIcon={<Refresh />} onClick={fetchVisits}>
                    Réessayer
                </Button>

                {debugInfo && (
                    <Accordion sx={{ mt: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="subtitle1">🔍 Informations de débogage</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box component="pre" sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, overflow: 'auto' }}>
                                {JSON.stringify(debugInfo, null, 2)}
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                )}
            </Box>
        );
    }

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
                    <Typography color="textSecondary" variant="h6" gutterBottom>
                        Aucune visite à venir
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Les visites qui vous seront assignées apparaîtront ici.
                    </Typography>
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
                                        {v.dateVisite || v.dateConfirmee ?
                                            new Date(v.dateVisite || v.dateConfirmee).toLocaleDateString('fr-FR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            }) :
                                            'N/A'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={v.statut}
                                            size="small"
                                            color={v.statut === 'ACCEPTE' ? 'success' : 'primary'}
                                        />
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

export default ResponsableUpcoming;