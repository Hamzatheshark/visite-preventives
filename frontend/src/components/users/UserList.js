// components/users/UserList.js - VERSION PROFESSIONNELLE
import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Button,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    Grid,
    TextField,
    MenuItem,
    Tab,
    Tabs,
    Badge,
    Tooltip,
    Switch,
    FormControlLabel,
    InputAdornment,
    Snackbar,
    Avatar,
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    Refresh,
    Person,
    Search,
    Clear,
    CheckCircle,
    Cancel,
    AdminPanelSettings,
    Engineering,
    SupervisorAccount,
    Email,
    Phone,
    Lock,
} from '@mui/icons-material';
import api from '../../api/axiosConfig';

const UserList = ({ role: propRole }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        role: 'TECHNICIEN_HARDWARE',
        motPasse: '',
        actif: true,
    });

    const roles = [
        { value: 'ADMIN', label: 'Administrateur' },
        { value: 'RESPONSABLE_SOFTWARE', label: 'Responsable Software' },
        { value: 'TECHNICIEN_HARDWARE', label: 'Technicien Hardware' },
    ];

    useEffect(() => {
        fetchUsers();
    }, [propRole, tabValue]);

    const getCountByRole = (role) => {
        return users.filter(u => u.role === role).length;
    };

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Vous devez être connecté');
                setLoading(false);
                return;
            }

            const response = await api.get('/utilisateurs');

            let userData = [];
            if (Array.isArray(response.data)) {
                userData = response.data;
            } else if (response.data && typeof response.data === 'object') {
                const keys = ['content', 'users', 'data', 'items', 'list'];
                for (const key of keys) {
                    if (response.data[key] && Array.isArray(response.data[key])) {
                        userData = response.data[key];
                        break;
                    }
                }
                if (userData.length === 0) {
                    const values = Object.values(response.data);
                    for (const val of values) {
                        if (Array.isArray(val) && val.length > 0) {
                            userData = val;
                            break;
                        }
                    }
                }
            }

            if (propRole) {
                userData = userData.filter(u => u.role === propRole);
            }

            if (tabValue === 1) {
                userData = userData.filter(u => u.role === 'RESPONSABLE_SOFTWARE');
            } else if (tabValue === 2) {
                userData = userData.filter(u => u.role === 'TECHNICIEN_HARDWARE' || u.role === 'TECHNICEN_HARDWARE');
            } else if (tabValue === 3) {
                userData = userData.filter(u => u.role === 'ADMIN');
            }

            setUsers(userData);
        } catch (error) {
            console.error('❌ Erreur:', error);
            let errorMessage = 'Erreur lors du chargement';
            if (error.response?.status === 401) {
                errorMessage = 'Session expirée - Reconnectez-vous';
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            setError(errorMessage);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (user = null) => {
        if (user) {
            setSelectedUser(user);
            setFormData({
                nom: user.nom || '',
                prenom: user.prenom || '',
                email: user.email || '',
                telephone: user.telephone || '',
                role: user.role || 'TECHNICIEN_HARDWARE',
                motPasse: '',
                actif: user.actif !== undefined ? user.actif : true,
            });
        } else {
            setSelectedUser(null);
            setFormData({
                nom: '',
                prenom: '',
                email: '',
                telephone: '',
                role: 'TECHNICIEN_HARDWARE',
                motPasse: '',
                actif: true,
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedUser(null);
        setError(null);
    };

    const handleSubmit = async () => {
        try {
            setError(null);
            const data = { ...formData };

            if (!data.nom || !data.prenom || !data.email) {
                setError('Nom, prénom et email sont obligatoires');
                return;
            }

            if (!selectedUser && (!data.motPasse || data.motPasse.length < 6)) {
                setError('Le mot de passe doit contenir au moins 6 caractères');
                return;
            }

            if (selectedUser) {
                await api.put(`/utilisateurs/${selectedUser.id}`, data);
                setSuccess(`✅ Utilisateur ${data.prenom} ${data.nom} modifié avec succès`);
            } else {
                await api.post('/auth/register', data);
                setSuccess(`✅ Utilisateur ${data.prenom} ${data.nom} créé avec succès`);
            }

            handleCloseDialog();
            fetchUsers();
            setTimeout(() => setSuccess(null), 5000);

        } catch (error) {
            console.error('❌ Erreur:', error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError('Erreur lors de la sauvegarde');
            }
        }
    };

    const handleDelete = async (id, nom, prenom) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${prenom} ${nom} ?`)) {
            try {
                await api.delete(`/utilisateurs/${id}`);
                setSuccess(`✅ ${prenom} ${nom} supprimé avec succès`);
                fetchUsers();
                setTimeout(() => setSuccess(null), 5000);
            } catch (error) {
                console.error('❌ Erreur:', error);
                setError('Erreur lors de la suppression');
            }
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            const newStatus = !user.actif;
            await api.put(`/utilisateurs/${user.id}`, {
                ...user,
                actif: newStatus,
            });
            setSuccess(`${user.prenom} ${user.nom} ${newStatus ? 'activé' : 'désactivé'}`);
            fetchUsers();
            setTimeout(() => setSuccess(null), 5000);
        } catch (error) {
            console.error('❌ Erreur:', error);
            setError('Erreur lors du changement de statut');
        }
    };

    const getRoleColor = (role) => {
        const colors = {
            'ADMIN': '#d32f2f',
            'RESPONSABLE_SOFTWARE': '#1976d2',
            'TECHNICIEN_HARDWARE': '#2e7d32',
            'TECHNICEN_HARDWARE': '#2e7d32',
        };
        return colors[role] || '#666';
    };

    const getRoleLabel = (role) => {
        const labels = {
            'ADMIN': 'Administrateur',
            'RESPONSABLE_SOFTWARE': 'Responsable',
            'TECHNICIEN_HARDWARE': 'Technicien',
            'TECHNICEN_HARDWARE': 'Technicien',
        };
        return labels[role] || role;
    };

    const getRoleIcon = (role) => {
        const icons = {
            'ADMIN': <AdminPanelSettings fontSize="small" />,
            'RESPONSABLE_SOFTWARE': <SupervisorAccount fontSize="small" />,
            'TECHNICIEN_HARDWARE': <Engineering fontSize="small" />,
            'TECHNICEN_HARDWARE': <Engineering fontSize="small" />,
        };
        return icons[role] || <Person fontSize="small" />;
    };

    const getInitials = (prenom, nom) => {
        if (!prenom && !nom) return '?';
        return `${(prenom || '').charAt(0)}${(nom || '').charAt(0)}`.toUpperCase();
    };

    const filteredUsers = users.filter(user => {
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            const fullName = `${user.prenom || ''} ${user.nom || ''}`.toLowerCase();
            return (
                fullName.includes(search) ||
                user.email?.toLowerCase().includes(search) ||
                user.telephone?.includes(search) ||
                user.role?.toLowerCase().includes(search)
            );
        }
        if (filterStatus === 'actif') return user.actif === true;
        if (filterStatus === 'inactif') return user.actif === false;
        return true;
    });

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2, color: 'text.secondary' }}>Chargement...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            {/* Snackbar */}
            <Snackbar
                open={!!success}
                autoHideDuration={5000}
                onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setSuccess(null)} sx={{ borderRadius: 2 }}>
                    {success}
                </Alert>
            </Snackbar>

            {/* Header */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
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
                    <Avatar sx={{ bgcolor: '#0044CC', width: 40, height: 40 }}>
                        <Person sx={{ color: 'white' }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                            Utilisateurs
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {users.length} membre(s)
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchUsers}
                        size="small"
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        Actualiser
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                        size="small"
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        Nouvel Utilisateur
                    </Button>
                </Box>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Tabs */}
            <Paper
                elevation={0}
                sx={{
                    mb: 3,
                    borderRadius: 2,
                    bgcolor: 'white',
                    border: '1px solid #e8ecf1',
                    overflow: 'hidden',
                }}
            >
                <Tabs
                    value={tabValue}
                    onChange={(e, v) => setTabValue(v)}
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        px: 2,
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.85rem',
                            minHeight: 44,
                            minWidth: 'auto',
                            px: 2,
                        }
                    }}
                >
                    <Tab label="Tous" />
                    <Tab
                        label={
                            <Badge badgeContent={getCountByRole('RESPONSABLE_SOFTWARE')} color="info" sx={{ '& .MuiBadge-badge': { fontSize: 10 } }}>
                                Responsables
                            </Badge>
                        }
                    />
                    <Tab
                        label={
                            <Badge badgeContent={getCountByRole('TECHNICIEN_HARDWARE') + getCountByRole('TECHNICEN_HARDWARE')} color="success" sx={{ '& .MuiBadge-badge': { fontSize: 10 } }}>
                                Techniciens
                            </Badge>
                        }
                    />
                    <Tab
                        label={
                            <Badge badgeContent={getCountByRole('ADMIN')} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10 } }}>
                                Admins
                            </Badge>
                        }
                    />
                </Tabs>
            </Paper>

            {/* Search */}
            <Paper
                elevation={0}
                sx={{
                    p: 1.5,
                    mb: 3,
                    borderRadius: 2,
                    bgcolor: 'white',
                    border: '1px solid #e8ecf1',
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}
            >
                <TextField
                    size="small"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ flexGrow: 1, minWidth: 180 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                            </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                            <IconButton size="small" onClick={() => setSearchTerm('')}>
                                <Clear fontSize="small" />
                            </IconButton>
                        ),
                        sx: { borderRadius: 2, height: 38 }
                    }}
                />
                <TextField
                    select
                    size="small"
                    label="Statut"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    sx={{ minWidth: 120 }}
                    SelectProps={{ sx: { borderRadius: 2, height: 38 } }}
                >
                    <MenuItem value="all">Tous</MenuItem>
                    <MenuItem value="actif">Actifs</MenuItem>
                    <MenuItem value="inactif">Inactifs</MenuItem>
                </TextField>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', fontSize: '0.8rem' }}>
                    {filteredUsers.length} résultat(s)
                </Typography>
            </Paper>

            {/* Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e8ecf1', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Utilisateur</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Contact</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Rôle</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Statut</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                                        {searchTerm ? 'Aucun résultat' : 'Aucun utilisateur'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    bgcolor: getRoleColor(user.role),
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {getInitials(user.prenom, user.nom)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {user.prenom} {user.nom}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    ID {user.id}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                            {user.email}
                                        </Typography>
                                        {user.telephone && (
                                            <Typography variant="caption" color="text.secondary">
                                                {user.telephone}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={getRoleIcon(user.role)}
                                            label={getRoleLabel(user.role)}
                                            size="small"
                                            sx={{
                                                bgcolor: getRoleColor(user.role) + '15',
                                                color: getRoleColor(user.role),
                                                fontWeight: 500,
                                                fontSize: '0.7rem',
                                                height: 26,
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.actif ? 'Actif' : 'Inactif'}
                                            color={user.actif ? 'success' : 'default'}
                                            size="small"
                                            sx={{ fontSize: '0.7rem', height: 26 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <Tooltip title="Modifier">
                                                <IconButton size="small" color="primary" onClick={() => handleOpenDialog(user)} sx={{ p: 0.5 }}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={user.actif ? 'Désactiver' : 'Activer'}>
                                                <IconButton
                                                    size="small"
                                                    color={user.actif ? 'warning' : 'success'}
                                                    onClick={() => handleToggleStatus(user)}
                                                    sx={{ p: 0.5 }}
                                                >
                                                    {user.actif ? <Cancel fontSize="small" /> : <CheckCircle fontSize="small" />}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Supprimer">
                                                <IconButton size="small" color="error" onClick={() => handleDelete(user.id, user.nom, user.prenom)} sx={{ p: 0.5 }}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {selectedUser ? <Edit color="primary" /> : <Add color="primary" />}
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {selectedUser ? `Modifier ${selectedUser.prenom}` : 'Nouvel Utilisateur'}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers sx={{ pt: 2 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nom"
                                size="small"
                                value={formData.nom}
                                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Prénom"
                                size="small"
                                value={formData.prenom}
                                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                size="small"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Téléphone"
                                size="small"
                                value={formData.telephone}
                                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                select
                                label="Rôle"
                                size="small"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                SelectProps={{ native: true }}
                            >
                                {roles.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {r.label}
                                    </option>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.actif}
                                        onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                                        color="success"
                                        size="small"
                                    />
                                }
                                label={formData.actif ? 'Actif' : 'Inactif'}
                            />
                        </Grid>
                        {!selectedUser && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Mot de passe"
                                    type="password"
                                    size="small"
                                    value={formData.motPasse}
                                    onChange={(e) => setFormData({ ...formData, motPasse: e.target.value })}
                                    required
                                    helperText="Min. 6 caractères"
                                />
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseDialog} size="small" sx={{ borderRadius: 2, textTransform: 'none' }}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                        size="small"
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        {selectedUser ? 'Modifier' : 'Créer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserList;