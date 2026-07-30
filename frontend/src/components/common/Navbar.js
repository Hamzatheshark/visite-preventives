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
} from '@mui/material';
import { Menu as MenuIcon, Logout, Person, Notifications } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

const Navbar = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState(null);
    const [notificationCount, setNotificationCount] = useState(0);
    const isHomePage = location.pathname === '/';

    // Récupérer le nombre de notifications non lues
    useEffect(() => {
        if (user) {
            fetchNotificationCount();
            // Rafraîchir toutes les 30 secondes
            const interval = setInterval(fetchNotificationCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchNotificationCount = async () => {
        try {
            const response = await api.get('/notifications/count');
            setNotificationCount(response.data.count || 0);
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

    return (
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    sx={{ mr: 2 }}
                    onClick={onMenuClick}
                >
                    <MenuIcon />
                </IconButton>
                <Typography
                    variant="h6"
                    sx={{ flexGrow: 1, cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                >
                    RMS
                </Typography>

                {!isHomePage && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>

                        {user ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                                <Typography variant="body2" sx={{ color: 'white' }}>
                                    {user.prenom} {user.nom}
                                </Typography>
                                <IconButton onClick={handleMenu} color="inherit">
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: getRoleColor() }}>
                                        {user.prenom?.charAt(0) || 'U'}
                                    </Avatar>
                                </IconButton>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={handleClose}
                                >
                                    <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                                        <Person sx={{ mr: 1 }} /> Profil
                                    </MenuItem>
                                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                                        <Logout sx={{ mr: 1 }} /> Déconnexion
                                    </MenuItem>
                                </Menu>
                            </Box>
                        ) : (
                            <Box>
                                <Button color="inherit" onClick={() => navigate('/register')} sx={{ mr: 1 }}>
                                    Inscription
                                </Button>
                                <Button color="inherit" onClick={() => navigate('/login')}>
                                    Connexion
                                </Button>
                            </Box>
                        )}
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;