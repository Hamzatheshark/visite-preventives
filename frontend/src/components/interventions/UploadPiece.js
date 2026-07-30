// components/interventions/UploadPiece.js
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    Alert,
    CircularProgress,
    Chip,
    IconButton,
    Grid,
    Divider,
} from '@mui/material';
import {
    CloudUpload,
    AttachFile,
    CheckCircle,
    Cancel,
    Delete,
    Visibility,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axiosConfig';

const UploadPiece = () => {
    const { planningId } = useParams();
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [existingPieces, setExistingPieces] = useState([]); // ✅ Initialiser avec un tableau vide
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExistingPieces();
    }, [planningId]);

    const fetchExistingPieces = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/pieces/intervention/planning/${planningId}`);
            // ✅ S'assurer que c'est un tableau
            const data = Array.isArray(response.data) ? response.data : [];
            setExistingPieces(data);
        } catch (error) {
            console.error('❌ Erreur:', error);
            setExistingPieces([]); // ✅ En cas d'erreur, mettre un tableau vide
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            // Vérifier la taille (max 10MB)
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError('Le fichier ne doit pas dépasser 10MB');
                return;
            }
            // Vérifier le type
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(selectedFile.type)) {
                setError('Format autorisé : PDF, JPG, PNG');
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Veuillez sélectionner un fichier');
            return;
        }

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('planningId', planningId);
        formData.append('description', description);

        try {
            const response = await api.post('/pieces/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setSuccess(true);
            setFile(null);
            setDescription('');
            setError(null);

            // Rafraîchir la liste
            await fetchExistingPieces();

            // Rediriger après 2 secondes
            setTimeout(() => {
                navigate('/pieces');
            }, 2000);

        } catch (error) {
            console.error('❌ Erreur upload:', error);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Erreur lors de l\'upload du fichier';
            setError(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (pieceId) => {
        if (!window.confirm('Confirmer la suppression de cette pièce ?')) return;

        try {
            await api.delete(`/pieces/${pieceId}`);
            await fetchExistingPieces();
        } catch (error) {
            console.error('❌ Erreur:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const handleView = (pieceId) => {
        window.open(`/api/pieces/download/${pieceId}`, '_blank');
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Chargement...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>
                📎 Attacher une pièce d'intervention
            </Typography>

            <Grid container spacing={3}>
                {/* Formulaire d'upload */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Nouvelle pièce jointe
                        </Typography>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                                {error}
                            </Alert>
                        )}

                        {success && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                ✅ Fichier uploadé avec succès !
                            </Alert>
                        )}

                        <Box
                            sx={{
                                border: '2px dashed #ccc',
                                borderRadius: 2,
                                p: 3,
                                textAlign: 'center',
                                mb: 2,
                                cursor: 'pointer',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'action.hover',
                                },
                            }}
                            onClick={() => document.getElementById('file-input').click()}
                        >
                            <input
                                id="file-input"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                            <Typography variant="body1" color="textSecondary">
                                {file ? file.name : 'Cliquez ou glissez un fichier ici'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Formats acceptés : PDF, JPG, PNG (max 10MB)
                            </Typography>
                        </Box>

                        {file && (
                            <Box sx={{ mb: 2 }}>
                                <Chip
                                    label={file.name}
                                    onDelete={() => setFile(null)}
                                    color="primary"
                                    sx={{ mr: 1 }}
                                />
                                <Chip
                                    label={`${(file.size / 1024).toFixed(0)} KB`}
                                    variant="outlined"
                                    size="small"
                                />
                            </Box>
                        )}

                        <TextField
                            label="Description"
                            multiline
                            rows={3}
                            fullWidth
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ajoutez une description pour cette pièce jointe..."
                            sx={{ mb: 2 }}
                        />

                        <Button
                            variant="contained"
                            startIcon={<AttachFile />}
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            fullWidth
                        >
                            {uploading ? <CircularProgress size={24} /> : 'Uploader le fichier'}
                        </Button>
                    </Paper>
                </Grid>

                {/* Liste des pièces existantes */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Pièces jointes existantes
                        </Typography>

                        {existingPieces.length === 0 ? (
                            <Typography color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                                Aucune pièce jointe pour cette visite
                            </Typography>
                        ) : (
                            existingPieces.map((piece) => (
                                <Paper
                                    key={piece.id}
                                    variant="outlined"
                                    sx={{ p: 2, mb: 2 }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {piece.nomFichier}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {piece.typeFichier} • {(piece.taille / 1024).toFixed(0)} KB
                                            </Typography>
                                            {piece.description && (
                                                <Typography variant="body2" color="textSecondary">
                                                    {piece.description}
                                                </Typography>
                                            )}
                                            <Typography variant="caption" display="block" color="textSecondary">
                                                Uploadé le {new Date(piece.dateUpload).toLocaleDateString('fr-FR')}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <IconButton size="small" onClick={() => handleView(piece.id)} color="primary">
                                                <Visibility />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDelete(piece.id)} color="error">
                                                <Delete />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Paper>
                            ))
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default UploadPiece;