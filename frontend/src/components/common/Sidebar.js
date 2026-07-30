// components/common/Sidebar.js - COMPLET CORRIGÉ
import React, { useState, useEffect } from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Divider,
    Box,
    Typography,
    Chip,
    Collapse,
    Badge,
} from '@mui/material';
import {
    Dashboard,
    Business,
    EventNote,
    CalendarToday,
    AttachFile,
    People,
    Notifications,
    Person,
    Build,
    History,
    Logout,
    ExpandLess,
    ExpandMore,
    List as ListIcon,
    SupervisorAccount,
    ManageAccounts,
    Construction,
    Assignment,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

const drawerWidth = 240;

const Sidebar = ({ open }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [userRole, setUserRole] = useState(null);
    const [notificationCount, setNotificationCount] = useState(0);

    useEffect(() => {
        let role = user?.role;
        if (!role) {
            try {
                const stored = localStorage.getItem('user');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    role = parsed?.role;
                }
            } catch (e) {
                console.error('Erreur lecture localStorage:', e);
            }
        }
        setUserRole(role);
        fetchNotificationCount();
    }, [user]);

    const fetchNotificationCount = async () => {
        try {
            const userId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;
            if (!userId) return;

            const response = await api.get(`/notifications/utilisateur/${userId}/count`);
            setNotificationCount(response.data?.count || 0);
        } catch (error) {
            console.error('❌ Erreur lors du comptage des notifications:', error);
        }
    };

    const isAdmin = userRole === 'ADMIN';
    const isResponsable = userRole === 'RESPONSABLE_SOFTWARE';
    const isTechnicien = userRole === 'TECHNICIEN_HARDWARE' || userRole === 'TECHNICEN_HARDWARE';

    // État pour les sous-menus
    const [openVisits, setOpenVisits] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // ===== MENU ADMIN (complet) =====
    const adminMenu = [
        { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', divider: false },
        { divider: true },
        { text: 'Clients & Sites', icon: <Business />, path: '/clients', divider: false },
        {
            text: 'Visites',
            icon: <EventNote />,
            open: openVisits,
            setOpen: setOpenVisits,
            subItems: [
                { text: 'Planning', path: '/plannings' },
                { text: 'Calendrier', path: '/calendar' },
            ]
        },
        // ✅ Supprimer "Équipe", garder directement "Utilisateurs"
        { text: 'Utilisateurs', icon: <People />, path: '/users', divider: false },
        { text: 'Pièces d\'intervention', icon: <AttachFile />, path: '/pieces', divider: false },
        { divider: true },
        { text: 'Historique', icon: <History />, path: '/history', divider: false },
        {
            text: 'Notifications',
            icon: (
                <Badge badgeContent={notificationCount} color="error">
                    <Notifications />
                </Badge>
            ),
            path: '/notifications',
            divider: false
        },
    ];

    // ===== MENU RESPONSABLE SOFTWARE =====
    const responsableMenu = [
        {
            text: 'Mes visites',
            icon: <Assignment />,
            open: openVisits,
            setOpen: setOpenVisits,
            subItems: [
                { text: 'À venir', path: '/responsable-upcoming' },
                { text: 'En attente', path: '/responsable-pending' },
                { text: 'En cours', path: '/responsable-current' },
                { text: 'Terminées', path: '/responsable-completed' },
                { text: 'Historique', path: '/responsable-history' },
            ]
        },
        {
            text: 'Notifications',
            icon: (
                <Badge badgeContent={notificationCount} color="error">
                    <Notifications />
                </Badge>
            ),
            path: '/notifications',
            divider: false
        },
    ];

    // ===== MENU TECHNICIEN HARDWARE =====
    const technicienMenu = [
        {
            text: 'Mes visites',
            icon: <Assignment />,
            open: openVisits,
            setOpen: setOpenVisits,
            subItems: [
                { text: 'À venir', path: '/technicien-upcoming' },
                { text: 'En attente', path: '/technicien-pending' },
                { text: 'En cours', path: '/technicien-current' },
                { text: 'Terminées', path: '/technicien-completed' },
                { text: 'Historique', path: '/technicien-history' },
            ]
        },
        {
            text: 'Notifications',
            icon: (
                <Badge badgeContent={notificationCount} color="error">
                    <Notifications />
                </Badge>
            ),
            path: '/notifications',
            divider: false
        },
    ];

    let menuItems = [];
    let roleLabel = 'Utilisateur';
    let roleColor = '#666';
    let roleIcon = <Person />;

    if (isAdmin) {
        menuItems = adminMenu;
        roleLabel = 'Administrateur RMS';
        roleColor = '#d32f2f';
        roleIcon = <SupervisorAccount sx={{ color: '#d32f2f' }} />;
    } else if (isResponsable) {
        menuItems = responsableMenu;
        roleLabel = 'Responsable Software';
        roleColor = '#1976d2';
        roleIcon = <ManageAccounts sx={{ color: '#1976d2' }} />;
    } else if (isTechnicien) {
        menuItems = technicienMenu;
        roleLabel = 'Technicien Hardware';
        roleColor = '#2e7d32';
        roleIcon = <Construction sx={{ color: '#2e7d32' }} />;
    } else {
        menuItems = [
            { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', divider: false },
        ];
        roleLabel = 'Rôle inconnu';
        roleColor = '#666';
        roleIcon = <Person />;
    }

    const renderMenuItem = (item, index) => {
        if (item.divider) {
            return <Divider key={index} sx={{ my: 1 }} />;
        }

        if (item.subItems) {
            const isOpen = item.open !== undefined ? item.open : true;
            const setIsOpen = item.setOpen || setOpenVisits;
            return (
                <div key={index}>
                    <ListItem button onClick={() => setIsOpen(!isOpen)}>
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                        {isOpen ? <ExpandLess /> : <ExpandMore />}
                    </ListItem>
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {item.subItems.map((sub, idx) => (
                                <ListItem
                                    button
                                    key={idx}
                                    sx={{ pl: 4 }}
                                    onClick={() => navigate(sub.path)}
                                    selected={location.pathname === sub.path}
                                >
                                    <ListItemIcon sx={{ minWidth: 30 }}>
                                        <ListIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary={sub.text} />
                                </ListItem>
                            ))}
                        </List>
                    </Collapse>
                </div>
            );
        }

        return (
            <ListItem
                button
                key={index}
                onClick={() => navigate(item.path)}
                selected={location.pathname === item.path}
                sx={{
                    '&.Mui-selected': {
                        backgroundColor: 'primary.light',
                        color: 'primary.main',
                    },
                }}
            >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
            </ListItem>
        );
    };

    return (
        <Drawer
            variant="persistent"
            open={open}
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    mt: '64px',
                    overflowX: 'hidden',
                },
            }}
        >
            <Toolbar />

            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    {roleIcon}
                    <Chip
                        label={roleLabel}
                        sx={{
                            bgcolor: roleColor + '20',
                            color: roleColor,
                            fontWeight: 'bold',
                        }}
                    />
                </Box>
                {user && (
                    <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                        {user.prenom} {user.nom}
                    </Typography>
                )}
            </Box>
            <Divider />

            <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
                <List>
                    {menuItems.map((item, index) => renderMenuItem(item, index))}
                </List>
            </Box>

            <Divider />

            <Box sx={{ p: 2 }}>
                <ListItem button onClick={() => navigate('/profile')}>
                    <ListItemIcon><Person /></ListItemIcon>
                    <ListItemText primary="Mon profil" />
                </ListItem>
                <ListItem button onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <ListItemIcon><Logout sx={{ color: 'error.main' }} /></ListItemIcon>
                    <ListItemText primary="Déconnexion" />
                </ListItem>
            </Box>
        </Drawer>
    );
};

export default Sidebar;