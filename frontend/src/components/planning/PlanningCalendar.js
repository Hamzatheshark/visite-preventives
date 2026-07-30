// components/planning/PlanningCalendar.js - CORRIGÉ

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    Close,
    EventNote,
    Person,
    LocationOn,
    CalendarToday,
    Refresh,
    FilterList,
    SupervisorAccount,
} from '@mui/icons-material';
import api from '../../api/axiosConfig';

const statusColors = {
    EN_ATTENTE: { bg: '#fff3cd', border: '#ff9800', label: 'En attente' },
    ACCEPTE: { bg: '#d4edda', border: '#4caf50', label: 'Accepté' },
    REFUSE: { bg: '#f8d7da', border: '#f44336', label: 'Refusé' },
    RELANCE: { bg: '#fff3cd', border: '#ff6f00', label: 'Relancé' },
    CONFIRME: { bg: '#cce5ff', border: '#1976d2', label: 'Confirmé' },
    REALISE: { bg: '#e2e3e5', border: '#6c757d', label: 'Réalisé' },
    ANNULE: { bg: '#e9ecef', border: '#000000', label: 'Annulé' },
};

// ✅ Statuts à afficher dans le calendrier
const VISIBLE_STATUSES = ['EN_ATTENTE', 'ACCEPTE', 'CONFIRME', 'RELANCE', 'REALISE'];

const PlanningCalendar = () => {
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchPlannings();
    }, []);

    useEffect(() => {
        filterEvents();
    }, [events, statusFilter]);

    const fetchPlannings = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/plannings');
            const plannings = response.data;

            const calendarEvents = plannings
                // ✅ FILTRE 1 : Exclure les statuts "ANNULE" et "REFUSE"
                .filter(p => {
                    if (!p.statut) return false;
                    // ✅ Ne pas afficher les visites annulées ou refusées
                    if (p.statut === 'ANNULE' || p.statut === 'REFUSE') return false;
                    return true;
                })
                // ✅ FILTRE 2 : Vérifier qu'une date existe
                .filter(p => p.dateVisite || p.dateConfirmee || p.dateProposee)
                .map(planning => {
                    // ✅ Priorité des dates : dateVisite > dateConfirmee > dateProposee
                    let date = planning.dateVisite || planning.dateConfirmee || planning.dateProposee;

                    // ✅ Vérifier que la date est valide
                    if (!date) return null;

                    const visitNumber = planning.numVisite ? `V${planning.numVisite}` : 'V?';
                    const clientName = planning.clientNom || 'Client inconnu';
                    const siteName = planning.siteNom || '';
                    const title = `${visitNumber} - ${clientName}${siteName ? ' - ' + siteName : ''}`;

                    const statusInfo = statusColors[planning.statut] || statusColors.EN_ATTENTE;

                    return {
                        id: planning.id.toString(),
                        title: title,
                        start: date,
                        allDay: true,
                        backgroundColor: statusInfo.border,
                        borderColor: statusInfo.border,
                        textColor: '#ffffff',
                        extendedProps: {
                            ...planning,
                            statusLabel: statusInfo.label,
                            statusColor: statusInfo.border,
                            visitNumber: visitNumber,
                            clientName: clientName,
                            siteName: siteName,
                        },
                    };
                })
                // ✅ Supprimer les null
                .filter(event => event !== null);

            setEvents(calendarEvents);
        } catch (error) {
            console.error('❌ Erreur chargement calendrier:', error);
            setError('Erreur lors du chargement des visites');
        } finally {
            setLoading(false);
        }
    };

    const filterEvents = () => {
        let filtered = events;

        // ✅ Filtrer par statut
        if (statusFilter !== 'all') {
            filtered = filtered.filter(e => e.extendedProps.statut === statusFilter);
        }

        setFilteredEvents(filtered);
    };

    const handleEventClick = (info) => {
        setSelectedEvent(info.event.extendedProps);
        setDialogOpen(true);
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const renderEventContent = (eventInfo) => {
        const { title, extendedProps } = eventInfo.event;
        const statusInfo = statusColors[extendedProps.statut] || statusColors.EN_ATTENTE;

        return (
            <div style={{
                padding: '2px 4px',
                fontSize: '11px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}>
                <span style={{ marginRight: '4px' }}>●</span>
                {title}
                <Chip
                    label={statusInfo.label}
                    size="small"
                    sx={{
                        height: '16px',
                        fontSize: '9px',
                        ml: '4px',
                        bgcolor: statusInfo.bg,
                        color: statusInfo.border,
                        '& .MuiChip-label': { px: '4px', py: '0px' }
                    }}
                />
            </div>
        );
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Chargement du calendrier...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4">
                    📅 Calendrier des Visites
                    <Chip
                        label={`${filteredEvents.length} visites`}
                        size="small"
                        sx={{ ml: 2 }}
                    />
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Filtrer par statut</InputLabel>
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            label="Filtrer par statut"
                        >
                            <MenuItem value="all">Tous</MenuItem>
                            {Object.entries(statusColors)
                                .filter(([key]) => VISIBLE_STATUSES.includes(key))
                                .map(([key, value]) => (
                                    <MenuItem key={key} value={key}>
                                        <Chip
                                            label={value.label}
                                            size="small"
                                            sx={{ bgcolor: value.bg, color: value.border }}
                                        />
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                    <Tooltip title="Actualiser">
                        <IconButton onClick={fetchPlannings} color="primary">
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    <FilterList sx={{ mr: 1 }} /> Légende :
                </Typography>
                {Object.entries(statusColors)
                    .filter(([key]) => VISIBLE_STATUSES.includes(key))
                    .map(([key, value]) => (
                        <Chip
                            key={key}
                            label={value.label}
                            size="small"
                            sx={{
                                bgcolor: value.bg,
                                color: value.border,
                                border: `1px solid ${value.border}`,
                            }}
                        />
                    ))}
                <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                    {filteredEvents.length} visite(s) affichée(s)
                </Typography>
            </Paper>

            <Paper sx={{ p: 2 }}>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    initialView="dayGridMonth"
                    events={filteredEvents}
                    eventClick={handleEventClick}
                    eventContent={renderEventContent}
                    height="auto"
                    locale="fr"
                    buttonText={{
                        today: "Aujourd'hui",
                        month: 'Mois',
                        week: 'Semaine',
                        day: 'Jour',
                    }}
                    eventTimeFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                    }}
                    dayMaxEvents={3}
                    displayEventEnd={false}
                    weekends={true}
                    nowIndicator={true}
                    // ✅ Masquer les événements passés (optionnel)
                    validRange={{
                        start: new Date(new Date().getFullYear(), 0, 1), // Début de l'année
                        end: new Date(new Date().getFullYear() + 1, 11, 31) // Fin de l'année suivante
                    }}
                />
            </Paper>

            {/* Dialog des détails */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EventNote sx={{ color: 'primary.main' }} />
                            <Typography variant="h6">
                                Détails de la visite
                            </Typography>
                            {selectedEvent && (
                                <Chip
                                    label={selectedEvent.visitNumber || 'V?'}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                            )}
                        </Box>
                        <IconButton onClick={() => setDialogOpen(false)} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedEvent && (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Box sx={{
                                    p: 2,
                                    borderRadius: 1,
                                    bgcolor: selectedEvent.statusColor + '15',
                                    border: `1px solid ${selectedEvent.statusColor}`,
                                }}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Statut
                                    </Typography>
                                    <Chip
                                        label={selectedEvent.statusLabel || 'N/A'}
                                        sx={{
                                            bgcolor: selectedEvent.statusColor + '20',
                                            color: selectedEvent.statusColor,
                                            fontWeight: 'bold',
                                            mt: 0.5,
                                        }}
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    <Person fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                                    Client
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {selectedEvent.clientNom || 'N/A'}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    <LocationOn fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                                    Site
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {selectedEvent.siteNom || 'N/A'}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    <CalendarToday fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                                    Numéro de visite
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {selectedEvent.visitNumber || 'V?'}
                                    {selectedEvent.nbVisitesAn && (
                                        <Chip
                                            label={`${selectedEvent.nbVisitesAn} visites/an`}
                                            size="small"
                                            variant="outlined"
                                            sx={{ ml: 1 }}
                                        />
                                    )}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    <EventNote fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                                    Date proposée
                                </Typography>
                                <Typography variant="body1">
                                    {formatDate(selectedEvent.dateProposee)}
                                </Typography>
                            </Grid>

                            {selectedEvent.dateConfirmee && (
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        ✅ Date confirmée
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDate(selectedEvent.dateConfirmee)}
                                    </Typography>
                                </Grid>
                            )}

                            {selectedEvent.dateVisite && (
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        🔧 Date de visite
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDate(selectedEvent.dateVisite)}
                                    </Typography>
                                </Grid>
                            )}

                            {selectedEvent.technicienNom && (
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        <Person fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                                        Technicien assigné
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {selectedEvent.technicienNom}
                                    </Typography>
                                </Grid>
                            )}

                            {selectedEvent.responsableNom && (
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        <SupervisorAccount fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                                        Responsable Software
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold" sx={{ color: '#1976d2' }}>
                                        {selectedEvent.responsableNom}
                                    </Typography>
                                </Grid>
                            )}

                            {selectedEvent.resultat && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Résultat
                                    </Typography>
                                    <Typography variant="body1" sx={{
                                        p: 1,
                                        bgcolor: '#f5f5f5',
                                        borderRadius: 1,
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {selectedEvent.resultat}
                                    </Typography>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} variant="contained">
                        Fermer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PlanningCalendar;