import React, { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import webSocketService from '../../services/websocketService';

const NotificationToast = () => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('info');

    useEffect(() => {
        webSocketService.addListener(handleNotification);
        return () => {
            webSocketService.removeListener(handleNotification);
        };
    }, []);

    const handleNotification = (data) => {
        // Ignorer les événements de connexion
        if (data.type === 'CONNECTED' || data.type === 'DISCONNECTED' || data.type === 'ERROR') {
            return;
        }

        if (data.message || data.titre) {
            setMessage(data.message || data.titre);
            setSeverity(data.type === 'ESCALADE' || data.type === 'ERROR' ? 'error' : 'info');
            setOpen(true);
        }
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Snackbar
            open={open}
            autoHideDuration={5000}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
            <Alert onClose={handleClose} severity={severity} variant="filled" sx={{ width: '100%' }}>
                {message}
            </Alert>
        </Snackbar>
    );
};

export default NotificationToast;