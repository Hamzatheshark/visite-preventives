// components/dashboard/Dashboard.js - AVEC VÉRIFICATION DES RÔLES
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
    Paper,
    FormControl,
    Select,
    MenuItem,
    Chip,
} from '@mui/material';
import {
    Business,
    EventNote,
    Pending,
    CheckCircle,
    Refresh as RefreshIcon,
    CalendarToday,
    Lock,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import webSocketService from '../../services/websocketService';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [availableYears, setAvailableYears] = useState([currentYear, currentYear + 1]);
    const [stats, setStats] = useState({
        clients: 0,
        plannings: 0,
        enAttente: 0,
        accepte: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ Vérifier si l'utilisateur est ADMIN
    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        // ✅ Rediriger si non admin
        if (!isAdmin) {
            navigate('/');
            return;
        }

        fetchStats();
        fetchAvailableYears();

        webSocketService.addStatusListener(handleStatusChange);
        webSocketService.addListener(handleNotificationUpdate);

        return () => {
            webSocketService.removeStatusListener(handleStatusChange);
            webSocketService.removeListener(handleNotificationUpdate);
        };
    }, [selectedYear, isAdmin]);

    const handleStatusChange = (data) => {
        console.log('🔄 [Dashboard] Changement de statut reçu:', data);
        fetchStats();
    };

    const handleNotificationUpdate = (data) => {
        if (data.type === 'STATUT_CHANGEMENT' ||
            data.type === 'NOUVELLE_VISITE' ||
            data.type === 'VISITE_TERMINEE' ||
            data.type === 'VISITE_ACCEPTEE') {
            console.log('📊 [Dashboard] Mise à jour des stats suite à une notification:', data.type);
            fetchStats();
        }
    };

    const fetchAvailableYears = async () => {
        try {
            const planningsRes = await api.get('/plannings');
            const plannings = Array.isArray(planningsRes.data) ? planningsRes.data : [];

            const years = new Set();
            plannings.forEach(p => {
                if (p.dateProposee) {
                    const year = new Date(p.dateProposee).getFullYear();
                    years.add(year);
                }
                if (p.dateConfirmee) {
                    const year = new Date(p.dateConfirmee).getFullYear();
                    years.add(year);
                }
                if (p.dateVisite) {
                    const year = new Date(p.dateVisite).getFullYear();
                    years.add(year);
                }
            });

            if (years.size === 0) {
                years.add(currentYear);
                years.add(currentYear + 1);
            }

            const sortedYears = Array.from(years).sort();
            setAvailableYears(sortedYears);
            if (!sortedYears.includes(selectedYear)) {
                setSelectedYear(sortedYears[0] || currentYear);
            }
        } catch (error) {
            console.error('❌ Erreur récupération années:', error);
        }
    };

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);

            const clientsRes = await api.get('/clients');
            const clients = Array.isArray(clientsRes.data) ? clientsRes.data : [];

            const planningsRes = await api.get('/plannings');
            const plannings = Array.isArray(planningsRes.data) ? planningsRes.data : [];

            const planningsByYear = plannings.filter(p => {
                const date = p.dateProposee || p.dateConfirmee || p.dateVisite;
                if (!date) return false;
                return new Date(date).getFullYear() === selectedYear;
            });

            const newStats = {
                clients: clients.length,
                plannings: planningsByYear.length,
                enAttente: planningsByYear.filter(p => p.statut === 'EN_ATTENTE' || p.statut === 'RELANCE').length,
                accepte: planningsByYear.filter(p => p.statut === 'ACCEPTE' || p.statut === 'CONFIRME').length,
            };

            setStats(newStats);

        } catch (err) {
            console.error('❌ Erreur:', err);
            setError('Impossible de charger les données.');
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon, color, onClick }) => (
        <Card
            sx={{
                height: '100%',
                transition: 'all 0.3s ease',
                borderRadius: 3,
                border: '1px solid #e8ecf1',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': onClick ? {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                } : {}
            }}
            onClick={onClick}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {title}
                        </Typography>
                        {loading ? (
                            <CircularProgress size={24} />
                        ) : (
                            <Typography variant="h3" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                                {value}
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            bgcolor: color + '15',
                            borderRadius: '12px',
                            padding: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {React.cloneElement(icon, { sx: { color: color, fontSize: 28 } })}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    // ✅ Si l'utilisateur n'est pas admin, afficher un message
    if (!isAdmin) {
        return (
            <Box sx={{ p: 3, bgcolor: '#f8f9fa', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 5,
                        borderRadius: 3,
                        bgcolor: 'white',
                        border: '1px solid #e8ecf1',
                        textAlign: 'center',
                        maxWidth: 400,
                        width: '100%',
                    }}
                >
                    <Lock sx={{ fontSize: 64, color: '#ed6c02', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e', mb: 1 }}>
                        Accès restreint
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Vous n'avez pas les droits pour accéder au tableau de bord.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/')}
                        sx={{ mt: 3, borderRadius: 2, textTransform: 'none' }}
                    >
                        Retour à l'accueil
                    </Button>
                </Paper>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                    <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchStats}>
                        Réessayer
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 3,
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
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                            Tableau de Bord
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Vue d'ensemble
                        </Typography>
                    </Box>
                    <Chip
                        icon={<CalendarToday />}
                        label={`${selectedYear}`}
                        color="primary"
                        size="small"
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            sx={{ borderRadius: 2 }}
                        >
                            {availableYears.map((year) => (
                                <MenuItem key={year} value={year}>
                                    {year}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: webSocketService.isConnected ? '#4caf50' : '#f44336',
                        }} />
                        <Typography variant="caption" color="text.secondary">
                            {webSocketService.isConnected ? 'En direct' : 'Déconnecté'}
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchStats}
                        size="small"
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            borderColor: '#e0e0e0',
                            color: '#666',
                            '&:hover': {
                                borderColor: '#0044CC',
                                color: '#0044CC',
                            }
                        }}
                    >
                        Actualiser
                    </Button>
                </Box>
            </Paper>

            {/* Stats */}
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Clients"
                        value={stats.clients}
                        icon={<Business />}
                        color="#1976d2"
                        onClick={() => navigate('/clients')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Visites"
                        value={stats.plannings}
                        icon={<EventNote />}
                        color="#2e7d32"
                        onClick={() => navigate('/plannings')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="En attente"
                        value={stats.enAttente}
                        icon={<Pending />}
                        color="#ed6c02"
                        onClick={() => navigate('/plannings')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Acceptées"
                        value={stats.accepte}
                        icon={<CheckCircle />}
                        color="#2e7d32"
                        onClick={() => navigate('/plannings')}
                    />
                </Grid>
            </Grid>

            {stats.plannings === 0 && !loading && (
                <Alert severity="info" sx={{ mt: 3, borderRadius: 3 }}>
                    <Typography variant="body2">
                        💡 Aucune visite en {selectedYear}. Créez un client et planifiez une visite pour commencer.
                    </Typography>
                </Alert>
            )}
        </Box>
    );
};

export default Dashboard;