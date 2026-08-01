// components/common/Sidebar.js - VERSION CORRIGÉE AVEC MENUS POUR TOUS LES RÔLES
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
    CheckCircle,
    Schedule,
    Work,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

const Sidebar = ({ open }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [userRole, setUserRole] = useState(null);

    const [openVisits, setOpenVisits] = useState(true);

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
    }, [user]);

    const isAdmin = userRole === 'ADMIN';
    const isResponsable = userRole === 'RESPONSABLE_SOFTWARE';
    const isTechnicien = userRole === 'TECHNICIEN_HARDWARE' || userRole === 'TECHNICEN_HARDWARE';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // ============================================
    // ===== MENU ADMIN =====
    // ============================================
    const adminMenu = [
        { text: 'Dashboard', icon: <Dashboard sx={{ color: '#1976d2' }} />, path: '/dashboard', divider: false },
        { divider: true, sx: { my: 1 } },
        { text: 'Clients & Sites', icon: <Business sx={{ color: '#1976d2' }} />, path: '/clients', divider: false },
        {
            text: 'Visites',
            icon: <EventNote sx={{ color: '#2e7d32' }} />,
            open: openVisits,
            setOpen: setOpenVisits,
            subItems: [
                { text: 'Planning', path: '/plannings', icon: <ListIcon fontSize="small" /> },
                { text: 'Calendrier', path: '/calendar', icon: <CalendarToday fontSize="small" /> },
            ]
        },
        { text: 'Utilisateurs', icon: <People sx={{ color: '#9c27b0' }} />, path: '/users', divider: false },
        { text: 'Pièces d\'intervention', icon: <AttachFile sx={{ color: '#ed6c02' }} />, path: '/pieces', divider: false },
        { divider: true, sx: { my: 1 } },
        { text: 'Historique', icon: <History sx={{ color: '#6c757d' }} />, path: '/history', divider: false },
    ];

    // ============================================
    // ===== MENU RESPONSABLE SOFTWARE =====
    // ============================================
    const responsableMenu = [
        {
            text: '📍 Mes visites',
            icon: <Assignment sx={{ color: '#1976d2' }} />,
            open: openVisits,
            setOpen: setOpenVisits,
            subItems: [
                {
                    text: 'À venir',
                    path: '/responsable-upcoming',
                    icon: <Schedule fontSize="small" sx={{ color: '#1976d2' }} />,
                },
                {
                    text: 'En cours',
                    path: '/responsable-current',
                    icon: <Work fontSize="small" sx={{ color: '#ed6c02' }} />,
                },
                {
                    text: 'Terminées',
                    path: '/responsable-completed',
                    icon: <CheckCircle fontSize="small" sx={{ color: '#2e7d32' }} />,
                },
            ]
        },
    ];

    // ============================================
    // ===== MENU TECHNICIEN HARDWARE =====
    // ============================================
    const technicienMenu = [
        {
            text: '🔧 Mes visites',
            icon: <Construction sx={{ color: '#2e7d32' }} />,
            open: openVisits,
            setOpen: setOpenVisits,
            subItems: [
                {
                    text: 'À venir',
                    path: '/technicien-upcoming',
                    icon: <Schedule fontSize="small" sx={{ color: '#1976d2' }} />,
                },
                {
                    text: 'En cours',
                    path: '/technicien-current',
                    icon: <Work fontSize="small" sx={{ color: '#ed6c02' }} />,
                },
                {
                    text: 'Terminées',
                    path: '/technicien-completed',
                    icon: <CheckCircle fontSize="small" sx={{ color: '#2e7d32' }} />,
                },
            ]
        },
    ];

    // ✅ Sélection du menu selon le rôle
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
        // ✅ Si rôle inconnu, afficher un message et déconnecter
        menuItems = [];
        roleLabel = 'Rôle inconnu';
        roleColor = '#666';
        roleIcon = <Person />;
    }

    const renderMenuItem = (item, index) => {
        if (item.divider) {
            return <Divider key={index} sx={{ my: item.sx?.my || 1 }} />;
        }

        if (item.subItems) {
            const isOpen = item.open !== undefined ? item.open : true;
            const setIsOpen = item.setOpen || setOpenVisits;
            return (
                <div key={index}>
                    <ListItem
                        button
                        onClick={() => setIsOpen(!isOpen)}
                        sx={{
                            borderRadius: 2,
                            mx: 1,
                            mb: 0.5,
                            '&:hover': {
                                bgcolor: 'action.hover',
                            }
                        }}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                                fontWeight: 500,
                                fontSize: '0.9rem',
                            }}
                        />
                        {isOpen ? <ExpandLess /> : <ExpandMore />}
                    </ListItem>
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {item.subItems.map((sub, idx) => (
                                <ListItem
                                    button
                                    key={idx}
                                    sx={{
                                        pl: 4,
                                        borderRadius: 2,
                                        mx: 1,
                                        mb: 0.3,
                                        '&.Mui-selected': {
                                            bgcolor: 'primary.light',
                                            '& .MuiListItemText-primary': {
                                                fontWeight: 600,
                                            }
                                        },
                                        '&:hover': {
                                            bgcolor: 'action.hover',
                                        }
                                    }}
                                    onClick={() => navigate(sub.path)}
                                    selected={location.pathname === sub.path}
                                >
                                    <ListItemIcon sx={{ minWidth: 30 }}>
                                        {sub.icon || <ListIcon fontSize="small" />}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={sub.text}
                                        primaryTypographyProps={{
                                            fontSize: '0.85rem',
                                        }}
                                    />
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
                    borderRadius: 2,
                    mx: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                        bgcolor: 'primary.light',
                        '& .MuiListItemText-primary': {
                            fontWeight: 600,
                        }
                    },
                    '&:hover': {
                        bgcolor: 'action.hover',
                    }
                }}
            >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                        fontWeight: 500,
                        fontSize: '0.9rem',
                    }}
                />
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
                    bgcolor: '#f8f9fa',
                    borderRight: '1px solid #e8ecf1',
                },
            }}
        >
            <Toolbar />

            {/* Profile Header */}
            <Box sx={{
                p: 2.5,
                textAlign: 'center',
                borderBottom: '1px solid #e8ecf1',
                bgcolor: 'white',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: roleColor + '20',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: roleColor,
                        }}
                    >
                        {roleIcon}
                    </Box>
                    <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                            {user?.prenom} {user?.nom}
                        </Typography>
                        <Chip
                            label={roleLabel}
                            size="small"
                            sx={{
                                height: '18px',
                                fontSize: '9px',
                                fontWeight: 600,
                                bgcolor: roleColor + '20',
                                color: roleColor,
                                border: `1px solid ${roleColor}40`,
                                '& .MuiChip-label': {
                                    px: 1,
                                    py: 0,
                                }
                            }}
                        />
                    </Box>
                </Box>
            </Box>

            {/* Menu Items */}
            <Box sx={{ overflow: 'auto', flexGrow: 1, p: 1 }}>
                <List>
                    {menuItems.map((item, index) => renderMenuItem(item, index))}
                </List>
            </Box>

            {/* Footer - Logout */}
            <Box sx={{ p: 1, borderTop: '1px solid #e8ecf1', bgcolor: 'white' }}>
                <ListItem
                    button
                    onClick={handleLogout}
                    sx={{
                        borderRadius: 2,
                        mx: 0.5,
                        color: 'error.main',
                        '&:hover': {
                            bgcolor: 'error.light',
                            color: 'error.dark',
                        }
                    }}
                >
                    <ListItemIcon>
                        <Logout sx={{ color: 'error.main' }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Déconnexion"
                        primaryTypographyProps={{
                            fontWeight: 500,
                            fontSize: '0.9rem',
                        }}
                    />
                </ListItem>
            </Box>
        </Drawer>
    );
};

export default Sidebar;