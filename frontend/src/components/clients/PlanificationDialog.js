import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Chip, Alert, CircularProgress,
    RadioGroup, FormControlLabel, Radio, Paper, Tabs, Tab,
} from '@mui/material';
import { PlayArrow, Info, CheckCircle } from '@mui/icons-material';
import api from '../../api/axiosConfig';

const PlanificationDialog = ({ open, onClose, clients, onConfirm, loading }) => {
    const [etat, setEtat] = useState(null);
    const [loadingEtat, setLoadingEtat] = useState(false);
    const [selectedPeriode, setSelectedPeriode] = useState(null);
    const [selectedAnnee, setSelectedAnnee] = useState(null);
    const [apercu, setApercu] = useState(null);
    const [loadingApercu, setLoadingApercu] = useState(false);

    // ✅ Charger l'état au démarrage
    useEffect(() => {
        if (!open) return;
        setLoadingEtat(true);
        setSelectedPeriode(null);
        setSelectedAnnee(null);
        setApercu(null);

        api.get('/plannings/etat-planification')
            .then(res => {
                setEtat(res.data);
                const periodes = res.data.prochainesPeriodes || [];
                // ✅ Sélectionner par défaut : période en cours, sinon prochaine future, sinon première
                const enCours = periodes.find(p => p.estEnCours);
                const prochaineFuture = periodes.find(p => !p.estPassee && !p.estEnCours);
                const defaut = enCours || prochaineFuture || periodes[0];
                if (defaut) {
                    setSelectedPeriode(defaut.periodeGlobale);
                    setSelectedAnnee(defaut.annee);
                }
            })
            .catch(err => console.error('❌ Erreur état:', err))
            .finally(() => setLoadingEtat(false));
    }, [open]);

    // ✅ Charger l'aperçu quand on change de période
    useEffect(() => {
        if (!open || !selectedPeriode) return;
        setLoadingApercu(true);
        api.get(`/plannings/apercu-planification/${selectedPeriode}`)
            .then(res => setApercu(res.data))
            .catch(err => console.error('❌ Erreur aperçu:', err))
            .finally(() => setLoadingApercu(false));
    }, [open, selectedPeriode]);

    // ✅ Grouper les périodes par année
    const periodesParAnnee = {};
    (etat?.prochainesPeriodes || []).forEach(p => {
        if (!periodesParAnnee[p.annee]) periodesParAnnee[p.annee] = [];
        periodesParAnnee[p.annee].push(p);
    });
    const anneesDisponibles = Object.keys(periodesParAnnee).map(Number).sort();

    const periodesAffichees = selectedAnnee ? periodesParAnnee[selectedAnnee] || [] : [];

    const getPeriodeSelectionnee = () =>
        etat?.prochainesPeriodes?.find(p => p.periodeGlobale === selectedPeriode);

    const getDescription = () => {
        const p = getPeriodeSelectionnee();
        if (!p) return '';
        const anneeTexte = p.annee === etat?.anneeActuelle ? 'cette année' : `${p.annee}`;
        switch (p.vagueLocale) {
            case 1: return `V1 pour tous les clients (2 et 4 visites/an) — ${anneeTexte}`;
            case 2: return `V2 pour les clients à 4 visites/an (2/an ignorés) — ${anneeTexte}`;
            case 3: return `V3 pour les clients à 4 visites/an + V2 pour les 2 visites/an — ${anneeTexte}`;
            case 4: return `V4 pour les clients à 4 visites/an (2/an ignorés) — ${anneeTexte}`;
            default: return '';
        }
    };

    const totalSites = apercu?.totalSites || 0;
    const totalConcernes = apercu?.total || 0;
    const parFrequence = apercu?.parFrequence || {};
    const frequences = [2, 4];

    const getVagueReelle = (freq) => {
        const p = getPeriodeSelectionnee();
        if (!p) return null;
        if (freq >= p.vagueLocale) return `V${p.vagueLocale}`;
        if (freq === 2 && p.vagueLocale === 3) return 'V2';
        return null;
    };

    const handleAnneeChange = (annee) => {
        setSelectedAnnee(annee);
        const premiere = periodesParAnnee[annee]?.[0];
        if (premiere) setSelectedPeriode(premiere.periodeGlobale);
    };

    const handleConfirm = () => {
        if (selectedPeriode) {
            onConfirm(selectedPeriode);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PlayArrow color="primary" />
                Planifier une vague de visites
            </DialogTitle>
            <DialogContent dividers>
                {loadingEtat ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2 }}>Chargement de l'état...</Typography>
                    </Box>
                ) : (
                    <>
                        {/* ✅ Info : période en cours */}
                        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                            <Typography variant="body2">
                                📅 Aujourd'hui : <strong>{etat?.dateAujourdhui}</strong> —
                                Période en cours : <strong>P{etat?.periodeEnCours}</strong> ({etat?.anneeActuelle})
                            </Typography>
                        </Alert>

                        {/* ✅ Sélecteur d'année (onglets) */}
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Choisir l'année :
                            </Typography>
                            <Tabs
                                value={selectedAnnee}
                                onChange={(e, v) => handleAnneeChange(v)}
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{
                                    borderBottom: '1px solid #e8ecf1',
                                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 40 },
                                }}
                            >
                                {anneesDisponibles.map(a => (
                                    <Tab
                                        key={a}
                                        value={a}
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                {a}
                                                {a === etat?.anneeActuelle && (
                                                    <Chip
                                                        label="actuelle"
                                                        size="small"
                                                        sx={{ height: 16, fontSize: '0.6rem', bgcolor: '#e8f5e9', color: '#2e7d32' }}
                                                    />
                                                )}
                                            </Box>
                                        }
                                    />
                                ))}
                            </Tabs>
                        </Box>

                        {/* ✅ Sélecteur de période dans l'année choisie */}
                        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Choisir la vague ({selectedAnnee}) :
                            </Typography>
                            <RadioGroup
                                row
                                value={selectedPeriode}
                                onChange={(e) => setSelectedPeriode(Number(e.target.value))}
                            >
                                {periodesAffichees.map(p => (
                                    <FormControlLabel
                                        key={p.periodeGlobale}
                                        value={p.periodeGlobale}
                                        control={<Radio size="small" />}
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Chip
                                                    label={p.label}
                                                    size="small"
                                                    color={
                                                        p.estEnCours ? 'warning' :
                                                            p.estPassee ? 'default' :
                                                                selectedPeriode === p.periodeGlobale ? 'primary' : 'default'
                                                    }
                                                    variant={p.estPassee ? 'outlined' : 'filled'}
                                                    sx={{
                                                        fontWeight: 600,
                                                        opacity: p.estPassee ? 0.5 : 1,
                                                    }}
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    {p.estEnCours ? '🟡 en cours' :
                                                        p.estPassee ? '✓ passée' :
                                                            p.vagueLocale === 1 ? 'Tous' :
                                                                p.vagueLocale === 2 ? '4/an' :
                                                                    p.vagueLocale === 3 ? '4/an + 2/an' : '4/an seulement'}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                ))}
                            </RadioGroup>
                        </Paper>

                        <Alert severity="info" icon={<Info />} sx={{ mb: 2, borderRadius: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {getDescription()}
                            </Typography>
                            <Typography variant="caption">
                                Cette action planifiera la prochaine visite due pour chaque client concerné.
                            </Typography>
                        </Alert>

                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                            {loadingApercu ? (
                                <>
                                    <CircularProgress size={16} />
                                    <span>Chargement de l'aperçu...</span>
                                </>
                            ) : (
                                <>Sites concernés : <strong>{totalConcernes}</strong> sur {totalSites}</>
                            )}
                        </Typography>

                        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', bgcolor: '#f5f7fa', p: 1.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Fréquence</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Sites concernés</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Vague réelle</Typography>
                            </Box>
                            {frequences.map(freq => {
                                const count = parFrequence[freq] || 0;
                                const vagueReelle = getVagueReelle(freq);
                                const ignore = vagueReelle === null;
                                return (
                                    <Box
                                        key={freq}
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr 1fr',
                                            p: 1.5,
                                            borderTop: '1px solid #e8ecf1',
                                            bgcolor: ignore ? '#fafafa' : 'white',
                                            opacity: ignore ? 0.6 : 1,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {freq} visites/an
                                        </Typography>
                                        <Typography variant="body2">
                                            {ignore ? (
                                                <span style={{ color: '#999' }}>0 site concerné</span>
                                            ) : (
                                                <><strong>{count}</strong> site(s)</>
                                            )}
                                        </Typography>
                                        <Box>
                                            {ignore ? (
                                                <Chip
                                                    label="Ignorés"
                                                    size="small"
                                                    sx={{ height: 22, fontSize: '0.65rem', bgcolor: '#f5f5f5', color: '#999' }}
                                                />
                                            ) : (
                                                <Chip
                                                    label={vagueReelle}
                                                    size="small"
                                                    color={getPeriodeSelectionnee()?.label === vagueReelle ? 'primary' : 'warning'}
                                                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Paper>

                        {totalConcernes === 0 && !loadingApercu && (
                            <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                                Aucun site ne sera concerné par cette vague. Choisissez une autre période.
                            </Alert>
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} disabled={loading}>
                    Annuler
                </Button>
                <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                    onClick={handleConfirm}
                    disabled={loading || loadingApercu || loadingEtat || totalConcernes === 0}
                >
                    {loading
                        ? 'Planification...'
                        : `Planifier ${getPeriodeSelectionnee()?.label || ''} ${selectedAnnee} (${totalConcernes} sites)`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PlanificationDialog;