import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Paper } from '@mui/material';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import Home from './components/home/Home';
import Dashboard from './components/dashboard/Dashboard';
import ClientList from './components/clients/ClientList';
import ClientForm from './components/clients/ClientForm';
import PlanningList from './components/planning/PlanningList';
import PlanningCalendar from './components/planning/PlanningCalendar';
import History from './components/planning/History';
import PieceInterventionList from './components/interventions/PieceInterventionList';
import UploadPiece from './components/interventions/UploadPiece';
import Login from './components/users/Login';
import Register from './components/users/Register';
import Profile from './components/users/Profile';
import UserList from './components/users/UserList';
import { AuthProvider } from './context/AuthContext';

// ===== IMPORTS TECHNICIENS =====
import TechnicianList from './components/technicians/TechnicianList';
import AssignTechnician from './components/technicians/AssignTechnician';
import TechnicienUpcoming from './components/technicien/TechnicienUpcoming';
import TechnicienPending from './components/technicien/TechnicienPending';
import TechnicienCurrent from './components/technicien/TechnicienCurrent';
import TechnicienCompleted from './components/technicien/TechnicienCompleted';
import TechnicienHistory from './components/technicien/TechnicienHistory';

// ===== IMPORTS RESPONSABLES =====
import ResponsableUpcoming from './components/responsable/ResponsableUpcoming';
import ResponsablePending from './components/responsable/ResponsablePending';
import ResponsableCurrent from './components/responsable/ResponsableCurrent';
import ResponsableCompleted from './components/responsable/ResponsableCompleted';
import ResponsableHistory from './components/responsable/ResponsableHistory';

// ===== AUTRES IMPORTS =====
import Emails from './components/emails/Emails';
import Stats from './components/stats/Stats';
import ImportExport from './components/importexport/ImportExport';
import Notifications from './components/notifications/NotificationList';
import SiteList from './components/sites/SiteList';
import NotificationToast from './components/common/NotificationToast';
import ProtectedRoute from './components/common/ProtectedRoute'; // ✅ NOUVEAU
import webSocketService from './services/websocketService';

// ===== THÈME =====
const theme = createTheme({
    palette: {
        primary: { main: '#0044CC' },
        secondary: { main: '#FF6B00' },
    },
});

// ===== COMPOSANT PLACEHOLDER =====
const PagePlaceholder = ({ title }) => {
    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h4" gutterBottom>{title}</Typography>
                <Typography variant="body1" color="text.secondary">
                    Cette page est en cours de développement
                </Typography>
            </Paper>
        </Box>
    );
};

// ===== APP CONTENT =====
const AppContent = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const hideNavbarPages = ['/login', '/register', '/'];
    const shouldHideNavbar = hideNavbarPages.includes(location.pathname);

    // ✅ Connexion WebSocket
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user?.id) {
                    console.log('🔗 Connexion WebSocket pour l\'utilisateur:', user.id);
                    webSocketService.connect(user.id);
                }
            } catch (e) {
                console.error('❌ Erreur parsing user:', e);
            }
        }
        return () => {
            webSocketService.disconnect();
        };
    }, []);

    return (
        <>
            {!shouldHideNavbar && <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />}
            <Box sx={{ display: 'flex' }}>
                {!shouldHideNavbar && <Sidebar open={sidebarOpen} />}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        ml: !shouldHideNavbar && sidebarOpen ? '240px' : 0,
                        transition: 'margin 0.3s ease',
                        mt: !shouldHideNavbar ? '64px' : 0,
                    }}
                >
                    <Routes>
                        {/* ===== ROUTES PUBLIQUES ===== */}
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* ===== ROUTES ADMIN (Protégées) ===== */}
                        <Route path="/dashboard" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <Dashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/clients" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <ClientList />
                            </ProtectedRoute>
                        } />
                        <Route path="/clients/new" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <ClientForm />
                            </ProtectedRoute>
                        } />
                        <Route path="/clients/edit/:id" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <ClientForm />
                            </ProtectedRoute>
                        } />
                        <Route path="/plannings" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <PlanningList />
                            </ProtectedRoute>
                        } />
                        <Route path="/calendar" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <PlanningCalendar />
                            </ProtectedRoute>
                        } />
                        <Route path="/history" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <History />
                            </ProtectedRoute>
                        } />
                        <Route path="/pieces" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <PieceInterventionList />
                            </ProtectedRoute>
                        } />
                        <Route path="/upload-pi/:planningId" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <UploadPiece />
                            </ProtectedRoute>
                        } />
                        <Route path="/sites" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <SiteList />
                            </ProtectedRoute>
                        } />

                        {/* ===== ROUTES UTILISATEURS (Admin uniquement) ===== */}
                        <Route path="/users" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <UserList />
                            </ProtectedRoute>
                        } />
                        <Route path="/users/responsables" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <UserList role="RESPONSABLE_SOFTWARE" />
                            </ProtectedRoute>
                        } />
                        <Route path="/users/technicians" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <UserList role="TECHNICIEN_HARDWARE" />
                            </ProtectedRoute>
                        } />
                        <Route path="/users/admins" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <UserList role="ADMIN" />
                            </ProtectedRoute>
                        } />

                        {/* ===== ROUTES TECHNICIENS (Admin uniquement) ===== */}
                        <Route path="/technicians" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <TechnicianList />
                            </ProtectedRoute>
                        } />
                        <Route path="/assign-technicians" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <AssignTechnician />
                            </ProtectedRoute>
                        } />

                        {/* ===== ROUTES IMPORT/EXPORT (Admin uniquement) ===== */}
                        <Route path="/import" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <ImportExport />
                            </ProtectedRoute>
                        } />
                        <Route path="/export" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <ImportExport />
                            </ProtectedRoute>
                        } />

                        {/* ===== ROUTES NOTIFICATIONS (Tous les rôles) ===== */}
                        <Route path="/notifications" element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'RESPONSABLE_SOFTWARE', 'TECHNICIEN_HARDWARE']}>
                                <Notifications />
                            </ProtectedRoute>
                        } />
                        <Route path="/settings" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <PagePlaceholder title="Paramètres" />
                            </ProtectedRoute>
                        } />

                        {/* ===== ROUTES RESPONSABLE ===== */}
                        <Route path="/responsable-upcoming" element={
                            <ProtectedRoute allowedRoles={['RESPONSABLE_SOFTWARE']}>
                                <ResponsableUpcoming />
                            </ProtectedRoute>
                        } />
                        <Route path="/responsable-pending" element={
                            <ProtectedRoute allowedRoles={['RESPONSABLE_SOFTWARE']}>
                                <ResponsablePending />
                            </ProtectedRoute>
                        } />
                        <Route path="/responsable-current" element={
                            <ProtectedRoute allowedRoles={['RESPONSABLE_SOFTWARE']}>
                                <ResponsableCurrent />
                            </ProtectedRoute>
                        } />
                        <Route path="/responsable-completed" element={
                            <ProtectedRoute allowedRoles={['RESPONSABLE_SOFTWARE']}>
                                <ResponsableCompleted />
                            </ProtectedRoute>
                        } />
                        <Route path="/responsable-history" element={
                            <ProtectedRoute allowedRoles={['RESPONSABLE_SOFTWARE']}>
                                <ResponsableHistory />
                            </ProtectedRoute>
                        } />

                        {/* ===== ROUTES TECHNICIEN ===== */}
                        <Route path="/technicien-upcoming" element={
                            <ProtectedRoute allowedRoles={['TECHNICIEN_HARDWARE', 'TECHNICEN_HARDWARE']}>
                                <TechnicienUpcoming />
                            </ProtectedRoute>
                        } />
                        <Route path="/technicien-pending" element={
                            <ProtectedRoute allowedRoles={['TECHNICIEN_HARDWARE', 'TECHNICEN_HARDWARE']}>
                                <TechnicienPending />
                            </ProtectedRoute>
                        } />
                        <Route path="/technicien-current" element={
                            <ProtectedRoute allowedRoles={['TECHNICIEN_HARDWARE', 'TECHNICEN_HARDWARE']}>
                                <TechnicienCurrent />
                            </ProtectedRoute>
                        } />
                        <Route path="/technicien-completed" element={
                            <ProtectedRoute allowedRoles={['TECHNICIEN_HARDWARE', 'TECHNICEN_HARDWARE']}>
                                <TechnicienCompleted />
                            </ProtectedRoute>
                        } />
                        <Route path="/technicien-history" element={
                            <ProtectedRoute allowedRoles={['TECHNICIEN_HARDWARE', 'TECHNICEN_HARDWARE']}>
                                <TechnicienHistory />
                            </ProtectedRoute>
                        } />

                        {/* ===== ROUTES EMAILS (Admin uniquement) ===== */}
                        <Route path="/emails" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <Emails />
                            </ProtectedRoute>
                        } />
                        <Route path="/emails/send" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <Emails />
                            </ProtectedRoute>
                        } />
                        <Route path="/emails/relances" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <Emails />
                            </ProtectedRoute>
                        } />
                        <Route path="/emails/history" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <Emails />
                            </ProtectedRoute>
                        } />

                        {/* ===== ROUTES STATS (Admin uniquement) ===== */}
                        <Route path="/stats" element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <Stats />
                            </ProtectedRoute>
                        } />

                        {/* ===== ROUTE PROFIL (Tous les rôles) ===== */}
                        <Route path="/profile" element={
                            <ProtectedRoute allowedRoles={['ADMIN', 'RESPONSABLE_SOFTWARE', 'TECHNICIEN_HARDWARE']}>
                                <Profile />
                            </ProtectedRoute>
                        } />

                        {/* ===== ROUTE 404 ===== */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </Box>
            </Box>
            <NotificationToast />
        </>
    );
};

// ===== APP =====
function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <Router>
                    <AppContent />
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;