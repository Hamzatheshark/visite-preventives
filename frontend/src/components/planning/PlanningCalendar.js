// components/planning/PlanningCalendar.js - CORRIGÉ AVEC RELANCE
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
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
    Avatar,
    Divider,
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
    CheckCircle,
    Pending,
    Cancel,
    Schedule,
    Email,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import webSocketService from '../../services/websocketService';

const statusColors = {
    EN_ATTENTE: { bg: '#fff3cd', color: '#ff9800', label: 'En attente', icon: <Pending sx={{ fontSize: 16 }} /> },
    ACCEPTE: { bg: '#d4edda', color: '#4caf50', label: 'Accepté', icon: <CheckCircle sx={{ fontSize: 16 }} /> },
    REFUSE: { bg: '#f8d7da', color: '#f44336', label: 'Refusé', icon: <Cancel sx={{ fontSize: 16 }} /> },
    RELANCE: { bg: '#fff3cd', color: '#ff6f00', label: 'Relancé', icon: <Email sx={{ fontSize: 16 }} /> },
    CONFIRME: { bg: '#cce5ff', color: '#1976d2', label: 'Confirmé', icon: <CheckCircle sx={{ fontSize: 16 }} /> },
    REALISE: { bg: '#e2e3e5', color: '#6c757d', label: 'Réalisé', icon: <CheckCircle sx={{ fontSize: 16 }} /> },
    ANNULE: { bg: '#e9ecef', color: '#000000', label: 'Annulé', icon: <Cancel sx={{ fontSize: 16 }} /> },
};

const VISIBLE_STATUSES = ['EN_ATTENTE', 'ACCEPTE', 'CONFIRME', 'RELANCE', 'REALISE'];

const PlanningCalendar = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchPlannings();

        webSocketService.addStatusListener(handleStatusChange);
        webSocketService.addListener(handleNotificationUpdate);

        return () => {
            webSocketService.removeStatusListener(handleStatusChange);
            webSocketService.removeListener(handleNotificationUpdate);
        };
    }, []);

    const handleStatusChange = (data) => {
        console.log('🔄 [Calendrier] Changement de statut reçu:', data);
        fetchPlannings();
    };

    const handleNotificationUpdate = (data) => {
        if (data.type === 'STATUT_CHANGEMENT' || data.type === 'NOUVELLE_VISITE') {
            fetchPlannings();
        }
    };

    useEffect(() => {
        filterEvents();
    }, [events, statusFilter]);

    const fetchPlannings = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/plannings');
            const plannings = response.data || [];

            const calendarEvents = plannings
                .filter(p => {
                    if (!p.statut) return false;
                    if (p.statut === 'ANNULE' || p.statut === 'REFUSE') return false;
                    return true;
                })
                .map(planning => {
                    // ✅ Priorité des dates : dateVisite > dateConfirmee > dateProposee
                    let date = planning.dateVisite || planning.dateConfirmee || planning.dateProposee;

                    // ✅ Pour RELANCE, si pas de date, utiliser dateEnvoi ou dateRelance
                    if (planning.statut === 'RELANCE' && !date) {
                        date = planning.dateEnvoi || planning.dateRelance;
                    }

                    // ✅ Si toujours pas de date, utiliser la date du jour + 1
                    if (!date) {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        date = tomorrow.toISOString().split('T')[0];
                    }

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
                        backgroundColor: statusInfo.color + '20',
                        borderColor: statusInfo.color,
                        textColor: statusInfo.color,
                        extendedProps: {
                            ...planning,
                            statusLabel: statusInfo.label,
                            statusColor: statusInfo.color,
                            visitNumber: visitNumber,
                            clientName: clientName,
                            siteName: siteName,
                        },
                    };
                })
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
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    p: '2px 6px',
                    borderRadius: 1,
                    bgcolor: statusInfo.color + '15',
                    border: `1px solid ${statusInfo.color}40`,
                    fontSize: '11px',
                    fontWeight: 600,
                    color: statusInfo.color,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: 'pointer',
                    '&:hover': {
                        bgcolor: statusInfo.color + '25',
                    }
                }}
            >
                <Box sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: statusInfo.color,
                    flexShrink: 0,
                }} />
                <Typography variant="caption" sx={{
                    fontWeight: 600,
                    fontSize: '10px',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
                    {title}
                </Typography>
            </Box>
        );
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2, color: 'text.secondary' }}>Chargement du calendrier...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 3,
                    bgcolor: 'white',
                    border: '1px solid #e8ecf1',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        sx={{
                            bgcolor: '#0044CC',
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                        }}
                    >
                        <CalendarToday sx={{ color: 'white' }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                            Calendrier des Visites
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {filteredEvents.length} visite(s) affichée(s)
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            displayEmpty
                            sx={{ borderRadius: 2 }}
                        >
                            <MenuItem value="all">Tous les statuts</MenuItem>
                            {Object.entries(statusColors)
                                .filter(([key]) => VISIBLE_STATUSES.includes(key))
                                .map(([key, value]) => (
                                    <MenuItem key={key} value={key}>
                                        <Chip
                                            label={value.label}
                                            size="small"
                                            sx={{ bgcolor: value.bg, color: value.color }}
                                        />
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                    <Tooltip title="Actualiser">
                        <IconButton onClick={fetchPlannings} sx={{ color: '#666' }}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Légende */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 3,
                    bgcolor: 'white',
                    border: '1px solid #e8ecf1',
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1.5,
                }}
            >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FilterList fontSize="small" /> Légende :
                </Typography>
                {Object.entries(statusColors)
                    .filter(([key]) => VISIBLE_STATUSES.includes(key))
                    .map(([key, value]) => (
                        <Chip
                            key={key}
                            label={value.label}
                            size="small"
                            icon={value.icon}
                            sx={{
                                bgcolor: value.bg,
                                color: value.color,
                                border: `1px solid ${value.color}40`,
                                '& .MuiChip-icon': {
                                    color: value.color,
                                }
                            }}
                        />
                    ))}
            </Paper>

            {/* Calendrier */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: 'white',
                    border: '1px solid #e8ecf1',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
            >
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    events={filteredEvents}
                    eventClick={handleEventClick}
                    eventContent={renderEventContent}
                    height="auto"
                    locale="fr"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: ''
                    }}
                    buttonText={{
                        today: "Aujourd'hui",
                        month: 'Mois',
                    }}
                    dayMaxEvents={3}
                    weekends={true}
                    nowIndicator={false}
                    validRange={{
                        start: new Date(new Date().getFullYear(), 0, 1),
                        end: new Date(new Date().getFullYear() + 1, 11, 31)
                    }}
                    views={{
                        dayGridMonth: {
                            type: 'dayGridMonth',
                            duration: { months: 1 },
                        }
                    }}
                    dayCellContent={(info) => {
                        return info.dayNumberText;
                    }}
                />
            </Paper>

            {/* Dialog des détails */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    }
                }}
            >
                <DialogTitle sx={{ pb: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EventNote sx={{ color: 'primary.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
                    {selectedEvent && (
                        <Chip
                            label={selectedEvent.statusLabel || 'N/A'}
                            size="small"
                            sx={{
                                mt: 1,
                                bgcolor: selectedEvent.statusColor + '20',
                                color: selectedEvent.statusColor,
                                fontWeight: 600,
                                border: `1px solid ${selectedEvent.statusColor}40`,
                            }}
                        />
                    )}
                </DialogTitle>
                <DialogContent dividers sx={{ pt: 2 }}>
                    {selectedEvent && (
                        <Grid container spacing={2.5}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    Client
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                                    {selectedEvent.clientNom || 'N/A'}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    Site
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                                    {selectedEvent.siteNom || 'N/A'}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    Date proposée
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                                    {formatDate(selectedEvent.dateProposee)}
                                </Typography>
                            </Grid>

                            {selectedEvent.dateConfirmee && (
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        ✅ Date confirmée
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5, color: '#2e7d32' }}>
                                        {formatDate(selectedEvent.dateConfirmee)}
                                    </Typography>
                                </Grid>
                            )}

                            {selectedEvent.dateVisite && (
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        🔧 Date de visite
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                                        {formatDate(selectedEvent.dateVisite)}
                                    </Typography>
                                </Grid>
                            )}

                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    Nb visites/an
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                                    {selectedEvent.nbVisitesAn || 'N/A'}
                                </Typography>
                            </Grid>

                            {selectedEvent.technicienNom && (
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        Technicien assigné
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5, color: '#1976d2' }}>
                                        {selectedEvent.technicienNom}
                                    </Typography>
                                </Grid>
                            )}

                            {selectedEvent.responsableNom && (
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        Responsable Software
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5, color: '#ed6c02' }}>
                                        {selectedEvent.responsableNom}
                                    </Typography>
                                </Grid>
                            )}

                            {selectedEvent.resultat && (
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        Résultat
                                    </Typography>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 1.5,
                                            mt: 0.5,
                                            borderRadius: 2,
                                            bgcolor: '#f8f9fa',
                                            borderColor: '#e8ecf1',
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                            {selectedEvent.resultat}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setDialogOpen(false)}
                        variant="contained"
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            px: 4,
                        }}
                    >
                        Fermer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PlanningCalendar;