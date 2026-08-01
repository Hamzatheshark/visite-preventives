// service/WebSocketNotificationService.java
package com.example.visite.service;

import com.example.visite.model.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Envoyer une notification à un utilisateur spécifique
     */
    public void sendNotificationToUser(Integer userId, Notification notification) {
        try {
            String destination = "/topic/user/" + userId + "/notifications";
            messagingTemplate.convertAndSend(destination, notification);
            log.info("📤 Notification WebSocket envoyée à l'utilisateur {}: {}", userId, notification.getTitre());
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'envoi WebSocket: {}", e.getMessage());
        }
    }

    /**
     * Envoyer une notification à tous les utilisateurs d'un rôle
     */
    public void sendNotificationToRole(String role, Notification notification) {
        try {
            String destination = "/topic/role/" + role + "/notifications";
            messagingTemplate.convertAndSend(destination, notification);
            log.info("📤 Notification WebSocket envoyée au rôle {}: {}", role, notification.getTitre());
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'envoi WebSocket: {}", e.getMessage());
        }
    }

    /**
     * Envoyer une notification de changement de statut
     */
    public void sendStatusChange(Integer planningId, String ancienStatut, String nouveauStatut) {
        try {
            String message = String.format("La visite V%d a changé de statut : %s -> %s",
                    planningId, ancienStatut, nouveauStatut);
            String destination = "/topic/status-changes";
            messagingTemplate.convertAndSend(destination, message);
            log.info("📤 Changement de statut envoyé: {}", message);
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'envoi du changement de statut: {}", e.getMessage());
        }
    }
}