// App.js
import React, { useState } from 'react';
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
import PieceInterventionList from './components/interventions/PieceInterventionList';
import Login from './components/users/Login';
import Register from './components/users/Register';
import Profile from './components/users/Profile';
import { AuthProvider } from './context/AuthContext';

// ===== NOUVEAUX IMPORTS =====
import TechnicianList from './components/technicians/TechnicianList';
import AssignTechnician from './components/technicians/AssignTechnician';
import UserList from './components/users/UserList';
import Emails from './components/emails/Emails';
import Stats from './components/stats/Stats';
import ImportExport from './components/importexport/ImportExport';
import Notifications from './components/notifications/NotificationList';

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

              {/* ===== ROUTES ADMIN ===== */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clients" element={<ClientList />} />
              <Route path="/clients/new" element={<ClientForm />} />
              <Route path="/clients/edit/:id" element={<ClientForm />} />
              <Route path="/plannings" element={<PlanningList />} />
              <Route path="/calendar" element={<PlanningCalendar />} />
              <Route path="/pieces" element={<PieceInterventionList />} />
              <Route path="/technicians" element={<TechnicianList />} />
              <Route path="/assign-technicians" element={<AssignTechnician />} />
              <Route path="/users" element={<UserList />} />
              <Route path="/users/responsables" element={<UserList role="RESPONSABLE_SOFTWARE" />} />
              <Route path="/users/technicians" element={<UserList role="TECHNICIEN_HARDWARE" />} />
              <Route path="/users/admins" element={<UserList role="ADMIN" />} />
              <Route path="/import" element={<ImportExport />} />
              <Route path="/export" element={<ImportExport />} />

              {/* ===== ROUTES ADMIN - PAGES EN DÉVELOPPEMENT ===== */}
              <Route path="/history" element={<PagePlaceholder title="Historique des visites" />} />
              <Route path="/pieces/pending" element={<PagePlaceholder title="Pièces d'intervention - À valider" />} />
              <Route path="/reports" element={<PagePlaceholder title="Rapports" />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<PagePlaceholder title="Paramètres" />} />

              {/* ===== ROUTES RESPONSABLE ===== */}
              <Route path="/visits/pending" element={<PagePlaceholder title="Visites - En attente" />} />
              <Route path="/visits/confirmed" element={<PagePlaceholder title="Visites - Confirmées" />} />
              <Route path="/visits/refused" element={<PagePlaceholder title="Visites - Refusées" />} />
              <Route path="/visits/reshcedule" element={<PagePlaceholder title="Visites - À reprogrammer" />} />
              <Route path="/emails" element={<Emails />} />
              <Route path="/emails/send" element={<Emails />} />
              <Route path="/emails/relances" element={<Emails />} />
              <Route path="/emails/history" element={<Emails />} />
              <Route path="/stats" element={<Stats />} />

              {/* ===== ROUTES TECHNICIEN ===== */}
              <Route path="/my-planning" element={<PagePlaceholder title="Mon planning" />} />
              <Route path="/my-visits" element={<PagePlaceholder title="Mes visites" />} />
              <Route path="/visit-details" element={<PagePlaceholder title="Détails de la visite" />} />
              <Route path="/my-history" element={<PagePlaceholder title="Historique" />} />

              {/* ===== ROUTE PROFIL ===== */}
              <Route path="/profile" element={<Profile />} />

              {/* ===== ROUTE 404 ===== */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Box>
        </Box>
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