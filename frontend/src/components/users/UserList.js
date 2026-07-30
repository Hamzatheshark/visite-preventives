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
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Person } from '@mui/icons-material';
import api from '../../api/axiosConfig';

const UserList = ({ role }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [tabValue, setTabValue] = useState(0);
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
    }, [role, tabValue]);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/utilisateurs');
            let allUsers = Array.isArray(response.data) ? response.data : [];

            // Filtrer par rôle si spécifié
            if (role) {
                allUsers = allUsers.filter(u => u.role === role);
            }

            // Filtrer par onglet
            if (tabValue === 1) {
                allUsers = allUsers.filter(u => u.role === 'RESPONSABLE_SOFTWARE');
            } else if (tabValue === 2) {
                allUsers = allUsers.filter(u => u.role === 'TECHNICIEN_HARDWARE');
            } else if (tabValue === 3) {
                allUsers = allUsers.filter(u => u.role === 'ADMIN');
            }

            setUsers(allUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Erreur lors du chargement des utilisateurs');
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
    };

    const handleSubmit = async () => {
        try {
            const data = { ...formData };
            if (!selectedUser) {
                if (!data.motPasse) {
                    setError('Le mot de passe est requis');
                    return;
                }
                await api.post('/auth/register', data);
            } else {
                await api.put(`/utilisateurs/${selectedUser.id}`, data);
            }
            handleCloseDialog();
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            setError('Erreur lors de la sauvegarde');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            try {
                await api.delete(`/utilisateurs/${id}`);
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                setError('Erreur lors de la suppression');
            }
        }
    };

    const getRoleColor = (role) => {
        const colors = {
            'ADMIN': '#d32f2f',
            'RESPONSABLE_SOFTWARE': '#1976d2',
            'TECHNICIEN_HARDWARE': '#2e7d32',
        };
        return colors[role] || '#666';
    };

    const getRoleLabel = (role) => {
        const labels = {
            'ADMIN': 'Administrateur',
            'RESPONSABLE_SOFTWARE': 'Responsable Software',
            'TECHNICIEN_HARDWARE': 'Technicien Hardware',
        };
        return labels[role] || role;
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Gestion des Utilisateurs</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
                    Nouvel Utilisateur
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab label="Tous" />
                    <Tab label="Responsables" />
                    <Tab label="Techniciens" />
                    <Tab label="Administrateurs" />
                </Tabs>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Nom</TableCell>
                            <TableCell>Prénom</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Téléphone</TableCell>
                            <TableCell>Rôle</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    Aucun utilisateur trouvé
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.id}</TableCell>
                                    <TableCell>{user.nom}</TableCell>
                                    <TableCell>{user.prenom}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.telephone || '-'}</TableCell>
                                    <TableCell>
                                        <Chip
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
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="small" onClick={() => handleOpenDialog(user)}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(user.id)}>
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedUser ? 'Modifier l\'Utilisateur' : 'Nouvel Utilisateur'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nom"
                                value={formData.nom}
                                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Prénom"
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
                                label="Rôle"
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
                        {!selectedUser && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Mot de passe"
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
                    <Button onClick={handleSubmit} variant="contained">
                        {selectedUser ? 'Modifier' : 'Créer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserList;