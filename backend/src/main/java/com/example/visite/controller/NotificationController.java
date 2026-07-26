// controller/NotificationController.java - Version complète
package com.example.visite.controller;

import com.example.visite.model.Notification;
import com.example.visite.model.Utilisateur;
import com.example.visite.repository.NotificationRepository;
import com.example.visite.repository.UtilisateurRepository;
import com.example.visite.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final UtilisateurRepository utilisateurRepository;

    // ✅ ENDPOINT /count - Récupérer le nombre total de notifications (pour tous)
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getNotificationCount() {
        log.info("🔔 Récupération du nombre total de notifications");

        Map<String, Long> response = new HashMap<>();
        long count = notificationRepository.count();
        response.put("count", count);

        return ResponseEntity.ok(response);
    }

    // ✅ ENDPOINT /count/{userId} - Récupérer le nombre de notifications non lues pour un utilisateur
    @GetMapping("/count/{userId}")
    public ResponseEntity<Map<String, Long>> getNotificationCountByUser(@PathVariable Integer userId) {
        log.info("🔔 Récupération du nombre de notifications pour l'utilisateur ID: {}", userId);

        Map<String, Long> response = new HashMap<>();
        try {
            long count = notificationService.countNonLuNotifications(userId);
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage());
            response.put("count", 0L);
            return ResponseEntity.ok(response);
        }
    }

    // Récupérer toutes les notifications d'un utilisateur
    @GetMapping("/utilisateur/{userId}")
    public ResponseEntity<List<Notification>> getNotificationsByUser(@PathVariable Integer userId) {
        log.info("🔔 Récupération des notifications pour l'utilisateur ID: {}", userId);
        try {
            List<Notification> notifications = notificationService.getNotificationsByUser(userId);
            log.info("📋 {} notification(s) trouvée(s)", notifications.size());
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // Récupérer les notifications non lues d'un utilisateur
    @GetMapping("/utilisateur/{userId}/non-lues")
    public ResponseEntity<List<Notification>> getNonLuNotifications(@PathVariable Integer userId) {
        log.info("🔔 Récupération des notifications non lues pour l'utilisateur ID: {}", userId);
        try {
            List<Notification> notifications = notificationService.getNonLuNotifications(userId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // Compter les notifications non lues d'un utilisateur
    @GetMapping("/utilisateur/{userId}/count")
    public ResponseEntity<Map<String, Long>> countNonLuNotifications(@PathVariable Integer userId) {
        log.info("🔔 Comptage des notifications non lues pour l'utilisateur ID: {}", userId);
        try {
            long count = notificationService.countNonLuNotifications(userId);
            Map<String, Long> response = new HashMap<>();
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage());
            Map<String, Long> response = new HashMap<>();
            response.put("count", 0L);
            return ResponseEntity.ok(response);
        }
    }

    // Marquer une notification comme lue
    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> marquerCommeLu(@PathVariable Integer id) {
        log.info("📌 Notification {} marquée comme lue", id);
        try {
            notificationService.marquerCommeLu(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Notification marquée comme lue");
            response.put("status", "success");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("message", "Erreur: " + e.getMessage());
            response.put("status", "error");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // Marquer toutes les notifications comme lues
    @PutMapping("/utilisateur/{userId}/read-all")
    public ResponseEntity<Map<String, String>> marquerToutesCommeLues(@PathVariable Integer userId) {
        log.info("📌 Toutes les notifications de l'utilisateur {} marquées comme lues", userId);
        try {
            notificationService.marquerToutesCommeLues(userId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Toutes les notifications marquées comme lues");
            response.put("status", "success");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("message", "Erreur: " + e.getMessage());
            response.put("status", "error");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // ENDPOINT DE TEST - Créer une notification de test
    @GetMapping("/test/{userId}")
    public ResponseEntity<Map<String, Object>> testNotifications(@PathVariable Integer userId) {
        log.info("🧪 Test de notifications pour l'utilisateur {}", userId);

        Map<String, Object> response = new HashMap<>();
        response.put("userId", userId);
        response.put("message", "Test de notification réussi");
        response.put("timestamp", LocalDateTime.now());

        try {
            Utilisateur user = utilisateurRepository.findById(userId).orElse(null);
            if (user != null) {
                Notification notif = new Notification();
                notif.setTitre("🔔 Test de notification");
                notif.setMessage("Ceci est une notification de test pour vérifier que le système fonctionne correctement.");
                notif.setType("TEST");
                notif.setUtilisateur(user);
                notif.setLu(false);
                notif.setDateCreation(LocalDateTime.now());
                notificationRepository.save(notif);

                response.put("testNotificationCreated", true);
                response.put("notificationId", notif.getId());
                log.info("✅ Notification de test créée avec l'ID: {}", notif.getId());
            } else {
                response.put("error", "Utilisateur non trouvé avec l'ID: " + userId);
            }
        } catch (Exception e) {
            log.error("❌ Erreur lors de la création de la notification de test", e);
            response.put("error", e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    // Endpoint pour créer une notification manuellement (utile pour les tests)
    @PostMapping("/create")
    public ResponseEntity<Notification> createNotification(@RequestBody Notification notification) {
        log.info("📝 Création d'une notification: {}", notification.getTitre());
        Notification created = notificationService.createNotification(notification);
        return ResponseEntity.ok(created);
    }

    // ✅ ENDPOINT pour récupérer toutes les notifications (admin)
    @GetMapping("/all")
    public ResponseEntity<List<Notification>> getAllNotifications() {
        log.info("🔔 Récupération de toutes les notifications");
        try {
            List<Notification> notifications = notificationRepository.findAllByOrderByDateCreationDesc();
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // ✅ ENDPOINT pour supprimer une notification
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteNotification(@PathVariable Integer id) {
        log.info("🗑️ Suppression de la notification {}", id);
        try {
            notificationRepository.deleteById(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Notification supprimée avec succès");
            response.put("status", "success");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("message", "Erreur: " + e.getMessage());
            response.put("status", "error");
            return ResponseEntity.internalServerError().body(response);
        }
    }
}