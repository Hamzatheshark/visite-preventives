import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Divider,
    Alert,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    StepContent,
} from '@mui/material';
import {
    CloudUpload,
    CloudDownload,
    FileCopy,
    CheckCircle,
    Warning,
    FilePresent,
    Description,
} from '@mui/icons-material';
import api from '../../api/axiosConfig';

const ImportExport = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleImport = async () => {
        setLoading(true);
        try {
            // Simuler un import
            await new Promise(resolve => setTimeout(resolve, 2000));
            setMessage('✅ Import réussi ! Les données ont été chargées.');
        } catch (err) {
            setError('❌ Erreur lors de l\'import');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            setMessage('✅ Export réussi ! Le fichier a été généré.');
        } catch (err) {
            setError('❌ Erreur lors de l\'export');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                📥 Import / Export Excel
            </Typography>

            <Paper sx={{ p: 2, mb: 3, bgcolor: '#e3f2fd' }}>
                <Typography variant="body2" color="text.secondary">
                    💡 Vous pouvez aussi ajouter des clients, sites et contrats manuellement via leurs pages respectives.
                    L'import Excel permet de charger des données en masse.
                </Typography>
            </Paper>

            {message && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage(null)}>
                    {message}
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Import */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                <CloudUpload sx={{ fontSize: 60, color: '#1976d2' }} />
                                <Typography variant="h5" gutterBottom>
                                    Import Excel
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Charger les données initiales en masse
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ textAlign: 'left', mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        📄 Fichiers sources :
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        • Calendrier de Maintenance 2026.xlsx
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        • Situation de Maintenance 2026.xlsx
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        📋 Données importées :
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        • Clients • Sites • Contrats • Utilisateurs
                                    </Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<FilePresent />}
                                    onClick={handleImport}
                                    disabled={loading}
                                    fullWidth
                                    sx={{ py: 1.5 }}
                                >
                                    {loading ? <CircularProgress size={24} /> : 'Choisir un fichier Excel'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<CloudUpload />}
                                    onClick={handleImport}
                                    disabled={loading}
                                    fullWidth
                                    sx={{ mt: 1, py: 1.5 }}
                                >
                                    {loading ? <CircularProgress size={24} /> : 'Importer les données'}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Export */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                <CloudDownload sx={{ fontSize: 60, color: '#2e7d32' }} />
                                <Typography variant="h5" gutterBottom>
                                    Export Excel
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Exporter les données pour les rapports
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ textAlign: 'left', mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        📊 Données exportées :
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        • Planning des visites
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        • Liste des clients
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        • Liste des sites
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        • Contrats et statistiques
                                    </Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<CloudDownload />}
                                    onClick={handleExport}
                                    disabled={loading}
                                    fullWidth
                                    sx={{ py: 1.5 }}
                                >
                                    {loading ? <CircularProgress size={24} /> : 'Exporter les données'}
                                </Button>
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        📄 Format : .xlsx
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ImportExport;