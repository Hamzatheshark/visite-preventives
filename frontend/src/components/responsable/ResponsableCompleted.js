// components/responsable/ResponsableCompleted.js
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, CircularProgress,
    Alert, Avatar, TableSortLabel, TextField, IconButton,
    InputAdornment,
} from '@mui/material';
import { CheckCircle, Search, Clear, History, SupervisorAccount } from '@mui/icons-material'; // ✅ ICI
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

const ResponsableCompleted = () => {
    const { user } = useAuth();
    const [visits, setVisits] = useState([]);
    const [filteredVisits, setFilteredVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        fetchVisits();
    }, []);

    useEffect(() => {
        filterAndSortVisits();
    }, [visits, searchTerm, sortBy, sortOrder]);

    const fetchVisits = async () => {
        setLoading(true);
        try {
            const userId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;
            const response = await api.get(`/plannings/responsable/${userId}`);
            const data = response.data || [];
            const filtered = data.filter(v => v.statut === 'REALISE');
            setVisits(filtered);
        } catch (error) {
            setError('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortVisits = () => {
        let result = [...visits];

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(v =>
                v.clientNom?.toLowerCase().includes(search) ||
                v.siteNom?.toLowerCase().includes(search) ||
                `V${v.numVisite}`.toLowerCase().includes(search)
            );
        }

        result.sort((a, b) => {
            let valA, valB;
            switch (sortBy) {
                case 'date':
                    valA = new Date(a.dateVisite || a.dateConfirmee);
                    valB = new Date(b.dateVisite || b.dateConfirmee);
                    break;
                case 'client':
                    valA = a.clientNom || '';
                    valB = b.clientNom || '';
                    break;
                case 'site':
                    valA = a.siteNom || '';
                    valB = b.siteNom || '';
                    break;
                default:
                    valA = new Date(a.dateVisite || a.dateConfirmee);
                    valB = new Date(b.dateVisite || b.dateConfirmee);
            }
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredVisits(result);
    };

    const handleSort = (field) => {
        setSortBy(field);
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2, color: 'text.secondary' }}>Chargement...</Typography>
        </Box>
    );

    if (error) return (
        <Box sx={{ p: 3 }}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
        </Box>
    );

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
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
                    <Avatar sx={{ bgcolor: '#2e7d32', width: 40, height: 40 }}>
                        <SupervisorAccount sx={{ color: 'white' }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                            ✅ Mes visites terminées
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {filteredVisits.length} visite(s)
                        </Typography>
                    </Box>
                </Box>
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
                <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                <TextField
                    size="small"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ flexGrow: 1, minWidth: 150 }}
                    InputProps={{
                        endAdornment: searchTerm && (
                            <IconButton size="small" onClick={() => setSearchTerm('')}>
                                <Clear fontSize="small" />
                            </IconButton>
                        ),
                        sx: { borderRadius: 2, height: 38 }
                    }}
                />
            </Paper>

            {/* Table */}
            {filteredVisits.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
                    <Typography color="text.secondary">
                        {searchTerm ? 'Aucun résultat' : 'Aucune visite terminée'}
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e8ecf1' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                <TableCell>
                                    <TableSortLabel
                                        active={sortBy === 'visite'}
                                        direction={sortOrder}
                                        onClick={() => handleSort('visite')}
                                        sx={{ fontWeight: 600 }}
                                    >
                                        N°
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={sortBy === 'client'}
                                        direction={sortOrder}
                                        onClick={() => handleSort('client')}
                                        sx={{ fontWeight: 600 }}
                                    >
                                        Client
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={sortBy === 'site'}
                                        direction={sortOrder}
                                        onClick={() => handleSort('site')}
                                        sx={{ fontWeight: 600 }}
                                    >
                                        Site
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={sortBy === 'date'}
                                        direction={sortOrder}
                                        onClick={() => handleSort('date')}
                                        sx={{ fontWeight: 600 }}
                                    >
                                        Date
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredVisits.map((v) => (
                                <TableRow key={v.id} hover>
                                    <TableCell>
                                        <Chip
                                            label={`V${v.numVisite}`}
                                            size="small"
                                            variant="outlined"
                                            sx={{ borderRadius: 1, height: 24, fontSize: '0.75rem' }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem' }}>{v.clientNom || 'N/A'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem' }}>{v.siteNom || 'N/A'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.85rem' }}>{formatDate(v.dateVisite || v.dateConfirmee)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label="Réalisé"
                                            size="small"
                                            color="success"
                                            sx={{ borderRadius: 1, height: 24, fontSize: '0.7rem', fontWeight: 500 }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default ResponsableCompleted;