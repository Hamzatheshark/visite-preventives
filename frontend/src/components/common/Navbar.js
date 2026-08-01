import React, { useState, useEffect } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    Badge,
    Divider,
    Chip,
    Tooltip,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Logout,
    Person,
    Notifications,
    Dashboard,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import webSocketService from '../../services/websocketService';

const Navbar = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState(null);
    const [notificationCount, setNotificationCount] = useState(0);
    const isHomePage = location.pathname === '/';

    useEffect(() => {
        if (user) {
            fetchNotificationCount();
            const interval = setInterval(fetchNotificationCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // ✅ Écouter les notifications WebSocket et les mises à jour
    useEffect(() => {
        // ✅ Écouter les nouvelles notifications
        webSocketService.addListener(handleWebSocketNotification);

        // ✅ Écouter l'événement personnalisé de mise à jour du compteur
        const handleCountUpdate = (event) => {
            if (event.detail?.count !== undefined) {
                console.log('📊 Navbar: Mise à jour du compteur:', event.detail.count);
                setNotificationCount(event.detail.count);
            }
        };

        window.addEventListener('notificationCountUpdate', handleCountUpdate);

        return () => {
            webSocketService.removeListener(handleWebSocketNotification);
            window.removeEventListener('notificationCountUpdate', handleCountUpdate);
        };
    }, []);

    // ✅ Gestionnaire des notifications WebSocket
    const handleWebSocketNotification = (data) => {
        if (data.type === 'CONNECTED' || data.type === 'DISCONNECTED' || data.type === 'ERROR') {
            return;
        }

        if (data.id && data.titre) {
            console.log('🔔 Navbar: Nouvelle notification reçue');
            setNotificationCount(prev => prev + 1);
        }
    };

    const fetchNotificationCount = async () => {
        try {
            const userId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;
            if (!userId) return;
            const response = await api.get(`/notifications/utilisateur/${userId}/count`);
            const count = response.data?.count || 0;
            setNotificationCount(count);
            // ✅ Stocker dans localStorage pour synchronisation
            localStorage.setItem('notificationCount', String(count));
        } catch (error) {
            console.error('Erreur notifications:', error);
        }
    };

    const handleMenu = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const handleLogout = () => {
        logout();
        handleClose();
        navigate('/');
    };

    const getRoleColor = () => {
        if (!user) return '#666';
        if (user.role === 'ADMIN') return '#d32f2f';
        if (user.role === 'RESPONSABLE_SOFTWARE') return '#1976d2';
        if (user.role === 'TECHNICIEN_HARDWARE') return '#2e7d32';
        return '#666';
    };

    const getRoleLabel = () => {
        if (!user) return '';
        if (user.role === 'ADMIN') return 'Admin';
        if (user.role === 'RESPONSABLE_SOFTWARE') return 'Responsable';
        if (user.role === 'TECHNICIEN_HARDWARE') return 'Technicien';
        return '';
    };

    const getFullName = () => {
        if (!user) return '';
        const prenom = user.prenom || '';
        const nom = user.nom || '';
        return `${prenom.toUpperCase()} ${nom.toUpperCase()}`.trim();
    };

    const getInitials = () => {
        if (!user) return 'U';
        const prenom = user.prenom || '';
        const nom = user.nom || '';
        return (prenom.charAt(0) + nom.charAt(0)).toUpperCase() || 'U';
    };

    return (
        <AppBar
            position="fixed"
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
        >
            <Toolbar sx={{ minHeight: '64px' }}>
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    sx={{
                        mr: 2,
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.1)',
                        }
                    }}
                    onClick={onMenuClick}
                >
                    <MenuIcon />
                </IconButton>

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        '&:hover': {
                            opacity: 0.8,
                        }
                    }}
                    onClick={() => navigate('/')}
                >
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 700,
                            letterSpacing: '1px',
                            background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: 'none',
                        }}
                    >
                        RMS
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            ml: 0.5,
                            color: 'rgba(255,255,255,0.5)',
                            fontWeight: 300,
                            letterSpacing: '2px',
                            display: { xs: 'none', sm: 'block' }
                        }}
                    >
                        • SYSTÈMES DE POINTAGE
                    </Typography>
                </Box>

                <Box sx={{ flexGrow: 1 }} />

                {!isHomePage && user && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {/* ✅ NOTIFICATIONS - UNIQUE BADGE */}
                        <Tooltip title="Notifications">
                            <IconButton
                                color="inherit"
                                onClick={() => navigate('/notifications')}
                                sx={{
                                    '&:hover': {
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                    }
                                }}
                            >
                                <Badge
                                    badgeContent={notificationCount}
                                    color="error"
                                    sx={{
                                        '& .MuiBadge-badge': {
                                            fontSize: '10px',
                                            height: '18px',
                                            minWidth: '18px',
                                            fontWeight: 700,
                                        }
                                    }}
                                >
                                    <Notifications />
                                </Badge>
                            </IconButton>
                        </Tooltip>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: 'white',
                                        fontWeight: 600,
                                        letterSpacing: '0.5px',
                                    }}
                                >
                                    {getFullName()}
                                </Typography>
                                <Chip
                                    label={getRoleLabel()}
                                    size="small"
                                    sx={{
                                        height: '22px',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        bgcolor: getRoleColor() + '25',
                                        color: getRoleColor(),
                                        border: `1px solid ${getRoleColor()}60`,
                                        '& .MuiChip-label': {
                                            px: 1.5,
                                            py: 0,
                                        }
                                    }}
                                />
                            </Box>

                            <Tooltip title="Profil">
                                <IconButton
                                    onClick={handleMenu}
                                    color="inherit"
                                    sx={{
                                        p: 0,
                                        '&:hover': {
                                            transform: 'scale(1.05)',
                                        }
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            bgcolor: getRoleColor(),
                                            fontWeight: 700,
                                            fontSize: '0.9rem',
                                            border: '2px solid rgba(255,255,255,0.2)',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                border: '2px solid rgba(255,255,255,0.5)',
                                            }
                                        }}
                                    >
                                        {getInitials()}
                                    </Avatar>
                                </IconButton>
                            </Tooltip>
                        </Box>

                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            PaperProps={{
                                sx: {
                                    mt: 1.5,
                                    borderRadius: 2,
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                                    minWidth: 220,
                                    overflow: 'hidden',
                                }
                            }}
                        >
                            <Box sx={{
                                px: 2,
                                py: 1.5,
                                bgcolor: 'primary.main',
                                color: 'white',
                            }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {getFullName()}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                    {user.email}
                                </Typography>
                            </Box>
                            <Divider />

                            <MenuItem
                                onClick={() => { handleClose(); navigate('/dashboard'); }}
                                sx={{ py: 1.5 }}
                            >
                                <Dashboard sx={{ mr: 2, fontSize: 20 }} /> Tableau de bord
                            </MenuItem>
                            <MenuItem
                                onClick={() => { handleClose(); navigate('/profile'); }}
                                sx={{ py: 1.5 }}
                            >
                                <Person sx={{ mr: 2, fontSize: 20 }} /> Mon profil
                            </MenuItem>
                            <MenuItem
                                onClick={() => { handleClose(); navigate('/notifications'); }}
                                sx={{ py: 1.5 }}
                            >
                                <Badge badgeContent={notificationCount} color="error" sx={{ mr: 2 }}>
                                    <Notifications />
                                </Badge>
                                Notifications
                            </MenuItem>
                            <Divider />
                            <MenuItem
                                onClick={handleLogout}
                                sx={{
                                    py: 1.5,
                                    color: 'error.main',
                                    '&:hover': {
                                        bgcolor: 'error.light',
                                        color: 'error.dark',
                                    }
                                }}
                            >
                                <Logout sx={{ mr: 2, fontSize: 20 }} /> Déconnexion
                            </MenuItem>
                        </Menu>
                    </Box>
                )}

                {!isHomePage && !user && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            color="inherit"
                            onClick={() => navigate('/register')}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                }
                            }}
                        >
                            Inscription
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/login')}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                bgcolor: 'white',
                                color: '#1a1a2e',
                                '&:hover': {
                                    bgcolor: '#f0f0f0',
                                }
                            }}
                        >
                            Connexion
                        </Button>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;