import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Divider,
} from '@mui/material';
import {
    EventNote,
    Pending,
    CheckCircle,
    Cancel,
    Warning,
    Business,
    People,
    AttachFile,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../api/axiosConfig';

const Stats = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalVisites: 0,
        enAttente: 0,
        accepte: 0,
        refuse: 0,
        realise: 0,
        relance: 0,
        totalClients: 0,
        totalSites: 0,
        totalTechniciens: 0,
        sansPI: 0,
    });
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const [planningsRes, clientsRes, usersRes, sitesRes, sansPIRes] = await Promise.all([
                api.get('/plannings'),
                api.get('/clients'),
                api.get('/utilisateurs'),
                api.get('/sites'),
                api.get('/plannings/sans-pi'),
            ]);

            const plannings = Array.isArray(planningsRes.data) ? planningsRes.data : [];
            const clients = Array.isArray(clientsRes.data) ? clientsRes.data : [];
            const users = Array.isArray(usersRes.data) ? usersRes.data : [];
            const sites = Array.isArray(sitesRes.data) ? sitesRes.data : [];
            const sansPI = Array.isArray(sansPIRes.data) ? sansPIRes.data : [];

            const techniciens = users.filter(u => u.role === 'TECHNICIEN_HARDWARE');

            const statsData = {
                totalVisites: plannings.length,
                enAttente: plannings.filter(p => p.statut === 'EN_ATTENTE').length,
                accepte: plannings.filter(p => p.statut === 'ACCEPTE').length,
                refuse: plannings.filter(p => p.statut === 'REFUSE').length,
                realise: plannings.filter(p => p.statut === 'REALISE').length,
                relance: plannings.filter(p => p.statut === 'RELANCE').length,
                totalClients: clients.length,
                totalSites: sites.length,
                totalTechniciens: techniciens.length,
                sansPI: sansPI.length,
            };
            setStats(statsData);

            // Données pour le graphique circulaire
            const pieData = [
                { name: 'En attente', value: statsData.enAttente },
                { name: 'Acceptées', value: statsData.accepte },
                { name: 'Refusées', value: statsData.refuse },
                { name: 'Réalisées', value: statsData.realise },
                { name: 'Relancées', value: statsData.relance },
            ].filter(item => item.value > 0);
            setChartData(pieData);

        } catch (error) {
            console.error('Error fetching stats:', error);
            setError('Erreur lors du chargement des statistiques');
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#ff9800', '#4caf50', '#f44336', '#9e9e9e', '#ff6f00'];

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

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                📊 Statistiques
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Visites"
                        value={stats.totalVisites}
                        icon={<EventNote sx={{ color: '#1976d2' }} />}
                        color="#1976d2"
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
                        icon={<CheckCircle sx={{ color: '#4caf50' }} />}
                        color="#4caf50"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Refusées"
                        value={stats.refuse}
                        icon={<Cancel sx={{ color: '#f44336' }} />}
                        color="#f44336"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Réalisées"
                        value={stats.realise}
                        icon={<CheckCircle sx={{ color: '#9e9e9e' }} />}
                        color="#9e9e9e"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Relancées"
                        value={stats.relance}
                        icon={<Warning sx={{ color: '#ff6f00' }} />}
                        color="#ff6f00"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Clients"
                        value={stats.totalClients}
                        icon={<Business sx={{ color: '#2e7d32' }} />}
                        color="#2e7d32"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Sites"
                        value={stats.totalSites}
                        icon={<Business sx={{ color: '#00695c' }} />}
                        color="#00695c"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Techniciens"
                        value={stats.totalTechniciens}
                        icon={<People sx={{ color: '#0d47a1' }} />}
                        color="#0d47a1"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="PI manquantes"
                        value={stats.sansPI}
                        icon={<AttachFile sx={{ color: '#e65100' }} />}
                        color="#e65100"
                    />
                </Grid>
            </Grid>

            {/* Graphiques */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Répartition des visites
                        </Typography>
                        <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={true}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Statistiques globales
                        </Typography>
                        <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={[
                                        { name: 'Visites', total: stats.totalVisites },
                                        { name: 'Clients', total: stats.totalClients },
                                        { name: 'Sites', total: stats.totalSites },
                                        { name: 'Techniciens', total: stats.totalTechniciens },
                                    ]}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="total" fill="#1976d2" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Stats;