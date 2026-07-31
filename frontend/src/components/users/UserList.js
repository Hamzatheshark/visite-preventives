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

            // Filtrer par rôle si spécifié
            if (propRole) {
                userData = userData.filter(u => u.role === propRole);
            }

            // Filtrer par onglet
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

            // Validation
            if (!data.nom || !data.prenom || !data.email) {
                setError('Nom, prénom et email sont obligatoires');
                return;
            }

            if (!selectedUser && (!data.motPasse || data.motPasse.length < 6)) {
                setError('Le mot de passe doit contenir au moins 6 caractères');
                return;
            }

            if (selectedUser) {
                // ✅ MODIFICATION
                await api.put(`/utilisateurs/${selectedUser.id}`, data);
                setSuccess(`✅ Utilisateur ${data.prenom} ${data.nom} modifié avec succès`);
            } else {
                // ✅ CRÉATION
                await api.post('/auth/register', data);
                setSuccess(`✅ Utilisateur ${data.prenom} ${data.nom} créé avec succès`);
            }

            handleCloseDialog();
            fetchUsers();

            // ✅ Notification de succès
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
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${prenom} ${nom} ? Cette action est irréversible.`)) {
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
            setSuccess(`${user.prenom} ${user.nom} ${newStatus ? 'activé' : 'désactivé'} avec succès`);
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
            'RESPONSABLE_SOFTWARE': 'Responsable Software',
            'TECHNICIEN_HARDWARE': 'Technicien Hardware',
            'TECHNICEN_HARDWARE': 'Technicien Hardware',
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
                <Typography sx={{ ml: 2 }}>Chargement des utilisateurs...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* ✅ Notification de succès */}
            <Snackbar
                open={!!success}
                autoHideDuration={5000}
                onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            </Snackbar>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4">👥 Gestion des Utilisateurs</Typography>
                    <Badge badgeContent={users.length} color="primary" sx={{ mr: 1 }}>
                        <Person />
                    </Badge>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchUsers}
                    >
                        Actualiser
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                    >
                        Nouvel Utilisateur
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={(e, v) => setTabValue(v)}
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab
                        label={
                            <Badge badgeContent={users.length} color="primary">
                                Tous
                            </Badge>
                        }
                    />
                    <Tab
                        label={
                            <Badge badgeContent={getCountByRole('RESPONSABLE_SOFTWARE')} color="info">
                                Responsables
                            </Badge>
                        }
                    />
                    <Tab
                        label={
                            <Badge badgeContent={getCountByRole('TECHNICIEN_HARDWARE') + getCountByRole('TECHNICEN_HARDWARE')} color="success">
                                Techniciens
                            </Badge>
                        }
                    />
                    <Tab
                        label={
                            <Badge badgeContent={getCountByRole('ADMIN')} color="error">
                                Administrateurs
                            </Badge>
                        }
                    />
                </Tabs>
            </Paper>

            <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                    size="small"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ flexGrow: 1, minWidth: 200 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                            <IconButton size="small" onClick={() => setSearchTerm('')}>
                                <Clear />
                            </IconButton>
                        ),
                    }}
                />
                <TextField
                    select
                    size="small"
                    label="Statut"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    sx={{ minWidth: 150 }}
                >
                    <MenuItem value="all">Tous</MenuItem>
                    <MenuItem value="actif">Actifs</MenuItem>
                    <MenuItem value="inactif">Inactifs</MenuItem>
                </TextField>
                <Typography variant="body2" color="textSecondary">
                    {filteredUsers.length} utilisateur(s)
                </Typography>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell><strong>ID</strong></TableCell>
                            <TableCell><strong>Utilisateur</strong></TableCell>
                            <TableCell><strong>Contact</strong></TableCell>
                            <TableCell><strong>Rôle</strong></TableCell>
                            <TableCell><strong>Statut</strong></TableCell>
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body1" color="textSecondary">
                                        {searchTerm ? 'Aucun résultat pour votre recherche' : 'Aucun utilisateur trouvé'}
                                    </Typography>
                                    {!searchTerm && (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            sx={{ mt: 2 }}
                                            startIcon={<Add />}
                                            onClick={() => handleOpenDialog()}
                                        >
                                            Créer un utilisateur
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>#{user.id}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Person sx={{ color: getRoleColor(user.role) }} />
                                            <Box>
                                                <Typography variant="body1" fontWeight="500">
                                                    {user.prenom} {user.nom}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    ID: {user.id}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{user.email}</Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {user.telephone || 'Pas de téléphone'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={getRoleIcon(user.role)}
                                            label={getRoleLabel(user.role)}
                                            size="small"
                                            sx={{
                                                bgcolor: getRoleColor(user.role) + '20',
                                                color: getRoleColor(user.role),
                                                fontWeight: 'bold',
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.actif ? 'Actif' : 'Inactif'}
                                            color={user.actif ? 'success' : 'default'}
                                            size="small"
                                            icon={user.actif ? <CheckCircle /> : <Cancel />}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <Tooltip title="Modifier">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleOpenDialog(user)}
                                                >
                                                    <Edit />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={user.actif ? 'Désactiver' : 'Activer'}>
                                                <IconButton
                                                    size="small"
                                                    color={user.actif ? 'warning' : 'success'}
                                                    onClick={() => handleToggleStatus(user)}
                                                >
                                                    {user.actif ? <Cancel /> : <CheckCircle />}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Supprimer">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDelete(user.id, user.nom, user.prenom)}
                                                >
                                                    <Delete />
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

            {/* ✅ DIALOG DE CRÉATION/MODIFICATION */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {selectedUser ? <Edit color="primary" /> : <Add color="primary" />}
                        <Typography variant="h6">
                            {selectedUser ? `Modifier ${selectedUser.prenom} ${selectedUser.nom}` : 'Nouvel Utilisateur'}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nom *"
                                value={formData.nom}
                                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Prénom *"
                                value={formData.prenom}
                                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Email *"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Téléphone"
                                value={formData.telephone}
                                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                select
                                label="Rôle *"
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
                                    />
                                }
                                label={formData.actif ? '✅ Actif' : '❌ Inactif'}
                            />
                        </Grid>
                        {!selectedUser && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Mot de passe *"
                                    type="password"
                                    value={formData.motPasse}
                                    onChange={(e) => setFormData({ ...formData, motPasse: e.target.value })}
                                    required
                                    helperText="Minimum 6 caractères"
                                />
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Annuler</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                        startIcon={selectedUser ? <Edit /> : <Add />}
                    >
                        {selectedUser ? 'Modifier' : 'Créer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserList;