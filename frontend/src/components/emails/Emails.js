import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Alert,
    Tab,
    Tabs,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { Send, Refresh, Email, History, Warning } from '@mui/icons-material';
import api from '../../api/axiosConfig';

const Emails = ({ type }) => {
    const [emails, setEmails] = useState([]);
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [emailContent, setEmailContent] = useState('');

    useEffect(() => {
        fetchData();
    }, [tabValue]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const visitsRes = await api.get('/plannings');
            const allVisits = Array.isArray(visitsRes.data) ? visitsRes.data : [];

            // Filtrer selon l'onglet
            let filteredVisits = [];
            if (tabValue === 0) {
                filteredVisits = allVisits.filter(v => v.statut === 'EN_ATTENTE');
            } else if (tabValue === 1) {
                filteredVisits = allVisits.filter(v => v.statut === 'RELANCE');
            } else {
                filteredVisits = allVisits;
            }
            setVisits(filteredVisits);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async (planningId) => {
        try {
            await api.post(`/plannings/envoyer/${planningId}`);
            setSuccess('Email envoyé avec succès');
            fetchData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Error sending email:', error);
            setError('Erreur lors de l\'envoi de l\'email');
        }
    };

    const handleSendRelance = async (planningId) => {
        try {
            await api.post(`/plannings/relance/${planningId}`);
            setSuccess('Relance envoyée avec succès');
            fetchData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Error sending relance:', error);
            setError('Erreur lors de l\'envoi de la relance');
        }
    };

    const handleOpenDialog = (visit) => {
        setSelectedVisit(visit);
        setEmailContent(`
Objet: [RMS] Proposition de visite de maintenance - ${visit.site?.client?.nom} - ${visit.site?.nom}

Bonjour,

Dans le cadre de votre contrat de maintenance, nous vous proposons une visite préventive pour le site suivant :

Site: ${visit.site?.nom}
Adresse: ${visit.site?.adresse || 'Non spécifiée'}
Date proposée: ${visit.dateProposee}

Merci de confirmer votre disponibilité en répondant par :
- "ACCEPTE" pour confirmer
- "REFUSE" pour refuser

Cordialement,
L'équipe RMS
        `);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedVisit(null);
    };

    const handleSendCustomEmail = async () => {
        try {
            // Ici vous pouvez implémenter l'envoi d'email personnalisé
            setSuccess('Email personnalisé envoyé avec succès');
            handleCloseDialog();
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            console.error('Error sending custom email:', error);
            setError('Erreur lors de l\'envoi');
        }
    };

    const getStatusColor = (statut) => {
        const colors = {
            'EN_ATTENTE': '#ff9800',
            'RELANCE': '#ff6f00',
            'ACCEPTE': '#4caf50',
            'REFUSE': '#f44336',
        };
        return colors[statut] || '#666';
    };

    const getStatusLabel = (statut) => {
        const labels = {
            'EN_ATTENTE': 'En attente',
            'RELANCE': 'Relancé',
            'ACCEPTE': 'Accepté',
            'REFUSE': 'Refusé',
        };
        return labels[statut] || statut;
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
                <Typography variant="h4">Gestion des Emails</Typography>
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

            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab label="📧 Envoyer propositions" />
                    <Tab label="📨 Relances" />
                    <Tab label="📜 Historique" />
                </Tabs>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Client</TableCell>
                            <TableCell>Site</TableCell>
                            <TableCell>Date proposée</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell>Nb relances</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {visits.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    Aucune visite trouvée
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
                                            label={getStatusLabel(visit.statut)}
                                            size="small"
                                            sx={{
                                                bgcolor: getStatusColor(visit.statut) + '20',
                                                color: getStatusColor(visit.statut),
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>{visit.nbRelances || 0}</TableCell>
                                    <TableCell>
                                        {tabValue === 0 && visit.statut === 'EN_ATTENTE' && (
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="primary"
                                                startIcon={<Send />}
                                                onClick={() => handleSendEmail(visit.id)}
                                            >
                                                Envoyer
                                            </Button>
                                        )}
                                        {tabValue === 1 && visit.statut === 'RELANCE' && (
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="warning"
                                                startIcon={<Warning />}
                                                onClick={() => handleSendRelance(visit.id)}
                                            >
                                                Relancer
                                            </Button>
                                        )}
                                        {tabValue === 2 && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="info"
                                                onClick={() => handleOpenDialog(visit)}
                                            >
                                                Voir
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>Email - {selectedVisit?.site?.client?.nom}</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        multiline
                        rows={12}
                        value={emailContent}
                        onChange={(e) => setEmailContent(e.target.value)}
                        variant="outlined"
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Fermer</Button>
                    <Button variant="contained" startIcon={<Send />} onClick={handleSendCustomEmail}>
                        Envoyer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Emails;