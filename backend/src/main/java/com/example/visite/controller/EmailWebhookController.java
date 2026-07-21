// controller/EmailWebhookController.java
package com.example.visite.controller;

import com.example.visite.service.PlanningService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/emails")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class EmailWebhookController {

    private final PlanningService planningService;

    @GetMapping("/reponse/{token}")
    public ResponseEntity<?> traiterReponseEmail(@PathVariable String token) {
        try {
            // Décoder le token (Base64 simple)
            String decoded = new String(Base64.getDecoder().decode(token));
            String[] parts = decoded.split(":");
            Integer planningId = Integer.parseInt(parts[0]);
            boolean accepte = Boolean.parseBoolean(parts[1]);

            planningService.traiterReponseClient(planningId, accepte);

            Map<String, String> response = new HashMap<>();
            response.put("message", accepte ?
                    "✅ Visite acceptée avec succès !" :
                    "❌ Visite refusée. Une nouvelle proposition vous sera envoyée.");
            response.put("statut", "success");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Erreur traitement réponse:", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "❌ Erreur lors du traitement de votre réponse");
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}