// controller/NotificationController.java
package com.example.visite.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class NotificationController {

    @GetMapping("/count")
    public ResponseEntity<Map<String, Integer>> getNotificationCount() {
        log.info("🔔 Récupération du nombre de notifications");

        Map<String, Integer> response = new HashMap<>();
        // Pour l'instant, retourner 0 car pas de système de notifications
        // Plus tard, vous pourrez compter les relances, visites en attente, etc.
        response.put("count", 0);

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications() {
        log.info("🔔 Récupération des notifications");

        Map<String, Object> response = new HashMap<>();
        response.put("notifications", new Object[0]); // Tableau vide
        response.put("count", 0);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/mark-read/{id}")
    public ResponseEntity<Map<String, String>> markAsRead(@PathVariable Integer id) {
        log.info("📌 Notification {} marquée comme lue", id);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Notification marquée comme lue");
        response.put("status", "success");

        return ResponseEntity.ok(response);
    }
}