// components/dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Button,
} from '@mui/material';
import {
    Business,
    EventNote,
    Pending,
    CheckCircle,
    Refresh as RefreshIcon, // ✅ Refresh depuis @mui/icons-material
} from '@mui/icons-material';
import api from '../../api/axiosConfig';

const Dashboard = () => {
    const [stats, setStats] = useState({
        clients: 0,
        plannings: 0,
        enAttente: 0,
        accepte: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('📊 Récupération des statistiques...');

            // Récupérer les clients
            const clientsRes = await api.get('/clients');
            console.log('📋 Clients reçus:', clientsRes.data);
            const clients = Array.isArray(clientsRes.data) ? clientsRes.data : [];

            // Récupérer les plannings
            const planningsRes = await api.get('/plannings');
            console.log('📋 Plannings reçus:', planningsRes.data);
            const plannings = Array.isArray(planningsRes.data) ? planningsRes.data : [];

            const newStats = {
                clients: clients.length,
                plannings: plannings.length,
                enAttente: plannings.filter(p => p.statut === 'EN_ATTENTE' || p.statut === 'RELANCE').length,
                accepte: plannings.filter(p => p.statut === 'ACCEPTE' || p.statut === 'CONFIRME').length,
            };

            console.log('📊 Statistiques calculées:', newStats);
            setStats(newStats);

        } catch (err) {
            console.error('❌ Erreur:', err);
            console.error('❌ Response:', err.response);
            setError('Impossible de charger les données. Vérifiez que le backend est démarré.');
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon, color }) => (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                        sx={{
                            backgroundColor: color + '20',
                            borderRadius: '50%',
                            padding: 1,
                            display: 'flex',
                            mr: 2,
                        }}
                    >
                        {icon}
                    </Box>
                    <Typography variant="h6" color="textSecondary">
                        {title}
                    </Typography>
                </Box>
                {loading ? (
                    <CircularProgress size={30} />
                ) : (
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        {value}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchStats}>
                    Réessayer
                </Button>
                <Typography variant="body2" sx={{ mt: 2 }}>
                    Assurez-vous que le backend est démarré sur http://localhost:8080
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">
                    📊 Tableau de Bord
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchStats}
                    size="small"
                >
                    Actualiser
                </Button>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Clients"
                        value={stats.clients}
                        icon={<Business sx={{ color: '#1976d2' }} />}
                        color="#1976d2"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Visites"
                        value={stats.plannings}
                        icon={<EventNote sx={{ color: '#4caf50' }} />}
                        color="#4caf50"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="En attente"
                        value={stats.enAttente}
                        icon={<Pending sx={{ color: '#ff9800' }} />}
                        color="#ff9800"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Acceptées"
                        value={stats.accepte}
                        icon={<CheckCircle sx={{ color: '#2196f3' }} />}
                        color="#2196f3"
                    />
                </Grid>
            </Grid>

            {stats.plannings === 0 && !loading && (
                <Alert severity="info" sx={{ mt: 3 }}>
                    <Typography variant="body2">
                        Aucune visite trouvée. Pour ajouter des données :
                    </Typography>
                    <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                        <li>Créez un client, un site et un contrat</li>
                        <li>Utilisez le bouton "Planifier" pour générer des visites</li>
                    </ul>
                </Alert>
            )}

            <Box sx={{ mt: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: 1 }}>
                <Typography variant="body2" color="success.main">
                    ✅ Application connectée au backend avec succès
                </Typography>
                <Typography variant="caption" color="textSecondary">
                    Backend: http://localhost:8080
                </Typography>
            </Box>
        </Box>
    );
};

export default Dashboard;