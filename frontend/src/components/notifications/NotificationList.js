// components/notifications/NotificationList.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    IconButton,
    Tooltip,
    Button,
    Badge,
    CircularProgress,
    Alert,
    Divider,
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    CheckCircle,
    Cancel,
    Assignment,
    PersonAdd,
    PersonOff,
    Refresh,
    DoneAll,
    Delete,
    Warning,
    Email,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

const NotificationList = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        setError(null);
        try {
            const userId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;
            if (!userId) {
                setError('Utilisateur non identifié');
                setLoading(false);
                return;
            }

            console.log('🔍 Récupération des notifications pour l\'utilisateur:', userId);
            const response = await api.get(`/notifications/utilisateur/${userId}`);
            console.log('📋 Notifications reçues:', response.data);

            setNotifications(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('❌ Erreur:', error);
            if (error.response?.status === 404) {
                setError('Endpoint non trouvé. Vérifiez que l\'API /notifications/utilisateur/{id} existe.');
            } else {
                setError('Erreur lors du chargement des notifications: ' + (error.response?.data?.message || error.message));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            fetchNotifications();
        } catch (error) {
            console.error('❌ Erreur:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const userId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;
            await api.put(`/notifications/utilisateur/${userId}/read-all`);
            fetchNotifications();
        } catch (error) {
            console.error('❌ Erreur:', error);
        }
    };

    const getTypeIcon = (type) => {
        const icons = {
            'STATUT_CHANGEMENT': <Assignment sx={{ color: '#1976d2' }} />,
            'TECHNICIEN_ASSIGNE': <PersonAdd sx={{ color: '#4caf50' }} />,
            'RESPONSABLE_ASSIGNE': <PersonAdd sx={{ color: '#4caf50' }} />,
            'TECHNICIEN_ANNULE': <PersonOff sx={{ color: '#f44336' }} />,
            'RESPONSABLE_ANNULE': <PersonOff sx={{ color: '#f44336' }} />,
            'VISITE_TERMINEE': <CheckCircle sx={{ color: '#4caf50' }} />,
            'VISITE_ACCEPTEE': <CheckCircle sx={{ color: '#4caf50' }} />,
            'NOUVELLE_VISITE': <Assignment sx={{ color: '#1976d2' }} />,
            'RELANCE': <Email sx={{ color: '#ff9800' }} />,
            'ESCALADE': <Warning sx={{ color: '#f44336' }} />,
            'TEST': <NotificationsIcon sx={{ color: '#9c27b0' }} />,
        };
        return icons[type] || <NotificationsIcon />;
    };

    const getTypeColor = (type) => {
        const colors = {
            'STATUT_CHANGEMENT': 'primary',
            'TECHNICIEN_ASSIGNE': 'success',
            'RESPONSABLE_ASSIGNE': 'success',
            'TECHNICIEN_ANNULE': 'error',
            'RESPONSABLE_ANNULE': 'error',
            'VISITE_TERMINEE': 'success',
            'VISITE_ACCEPTEE': 'success',
            'NOUVELLE_VISITE': 'info',
            'RELANCE': 'warning',
            'ESCALADE': 'error',
            'TEST': 'secondary',
        };
        return colors[type] || 'default';
    };

    const getTypeLabel = (type) => {
        const labels = {
            'STATUT_CHANGEMENT': 'Changement de statut',
            'TECHNICIEN_ASSIGNE': 'Technicien assigné',
            'RESPONSABLE_ASSIGNE': 'Responsable assigné',
            'TECHNICIEN_ANNULE': 'Technicien désassigné',
            'RESPONSABLE_ANNULE': 'Responsable désassigné',
            'VISITE_TERMINEE': 'Visite terminée',
            'VISITE_ACCEPTEE': 'Visite acceptée',
            'NOUVELLE_VISITE': 'Nouvelle visite',
            'RELANCE': 'Relance',
            'ESCALADE': 'Escalade',
            'TEST': 'Test',
        };
        return labels[type] || type;
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const unreadCount = notifications.filter(n => !n.lu).length;

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Chargement des notifications...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button variant="contained" startIcon={<Refresh />} onClick={fetchNotifications}>
                    Réessayer
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4">
                        🔔 Notifications
                    </Typography>
                    {unreadCount > 0 && (
                        <Chip
                            label={`${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`}
                            color="primary"
                            size="small"
                        />
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Marquer toutes comme lues">
                        <Button
                            variant="outlined"
                            startIcon={<DoneAll />}
                            onClick={handleMarkAllAsRead}
                            disabled={unreadCount === 0}
                            size="small"
                        >
                            Tout lire
                        </Button>
                    </Tooltip>
                    <Tooltip title="Actualiser">
                        <IconButton onClick={fetchNotifications} size="small">
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {notifications.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center' }}>
                    <NotificationsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                        Aucune notification
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Vous serez notifié des changements concernant vos visites.
                    </Typography>
                </Paper>
            ) : (
                <Paper>
                    <List>
                        {notifications.map((notif, index) => (
                            <React.Fragment key={notif.id}>
                                <ListItem
                                    sx={{
                                        bgcolor: notif.lu ? 'transparent' : 'action.hover',
                                        '&:hover': { bgcolor: 'action.hover' },
                                        flexDirection: 'column',
                                        alignItems: 'stretch',
                                        py: 2,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                                        <ListItemIcon sx={{ mt: 0.5 }}>
                                            <Badge
                                                color="primary"
                                                variant="dot"
                                                invisible={notif.lu}
                                            >
                                                {getTypeIcon(notif.type)}
                                            </Badge>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: notif.lu ? 'normal' : 'bold' }}>
                                                        {notif.titre}
                                                    </Typography>
                                                    <Chip
                                                        label={getTypeLabel(notif.type)}
                                                        size="small"
                                                        color={getTypeColor(notif.type)}
                                                        variant="outlined"
                                                    />
                                                    {!notif.lu && (
                                                        <Chip
                                                            label="Nouveau"
                                                            size="small"
                                                            color="primary"
                                                            sx={{ fontWeight: 'bold' }}
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            whiteSpace: 'pre-wrap',
                                                            color: notif.lu ? 'text.secondary' : 'text.primary'
                                                        }}
                                                    >
                                                        {notif.message}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                                        📅 {formatDate(notif.dateCreation)}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                                            {!notif.lu && (
                                                <Tooltip title="Marquer comme lue">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleMarkAsRead(notif.id)}
                                                        sx={{ color: 'primary.main' }}
                                                    >
                                                        <CheckCircle fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Supprimer">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleMarkAsRead(notif.id)}
                                                    sx={{ color: 'error.main' }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                </ListItem>
                                {index < notifications.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default NotificationList;