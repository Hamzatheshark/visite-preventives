package com.example.visite.controller;

import com.example.visite.model.Utilisateur;
import com.example.visite.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class UtilisateurController {

    private final UtilisateurRepository utilisateurRepository;

    @GetMapping
    public ResponseEntity<List<Utilisateur>> getAllUtilisateurs() {
        List<Utilisateur> utilisateurs = utilisateurRepository.findAll();
        log.info("📋 Tous les utilisateurs: {} trouvés", utilisateurs.size());
        return ResponseEntity.ok(utilisateurs);
    }

    @GetMapping("/techniciens")
    public ResponseEntity<List<Utilisateur>> getTechniciens() {
        log.info("🔍 Recherche des techniciens actifs...");

        List<Utilisateur> allUsers = utilisateurRepository.findAll();
        log.info("📋 {} utilisateurs trouvés au total", allUsers.size());

        List<Utilisateur> techniciens = allUsers.stream()
                .filter(u -> u.getActif() != null && u.getActif())
                .filter(u -> {
                    if (u.getRole() == null) return false;
                    String role = u.getRole().name();
                    return role.equals("TECHNICIEN_HARDWARE") ||
                            role.equals("TECHNICEN_HARDWARE");
                })
                .collect(Collectors.toList());

        log.info("✅ {} technicien(s) trouvé(s)", techniciens.size());

        for (Utilisateur u : techniciens) {
            log.info("   - ID: {}, Nom: {}, Prénom: {}, Rôle: {}",
                    u.getId(), u.getNom(), u.getPrenom(), u.getRole());
        }

        return ResponseEntity.ok(techniciens);
    }

    @GetMapping("/responsables")
    public ResponseEntity<List<Utilisateur>> getResponsables() {
        log.info("🔍 Recherche des responsables actifs...");

        List<Utilisateur> allUsers = utilisateurRepository.findAll();

        List<Utilisateur> responsables = allUsers.stream()
                .filter(u -> u.getActif() != null && u.getActif())
                .filter(u -> {
                    if (u.getRole() == null) return false;
                    String role = u.getRole().name();
                    return role.equals("RESPONSABLE_SOFTWARE");
                })
                .collect(Collectors.toList());

        log.info("✅ {} responsable(s) trouvé(s)", responsables.size());

        for (Utilisateur u : responsables) {
            log.info("   - ID: {}, Nom: {}, Prénom: {}, Rôle: {}",
                    u.getId(), u.getNom(), u.getPrenom(), u.getRole());
        }

        return ResponseEntity.ok(responsables);
    }

    // ✅ NOUVEL ENDPOINT - Vérifier le rôle d'un utilisateur
    @GetMapping("/{id}/role")
    public ResponseEntity<Map<String, Object>> getUserRole(@PathVariable Integer id) {
        try {
            log.info("🔍 Vérification du rôle pour l'utilisateur ID: {}", id);

            Utilisateur user = utilisateurRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("nom", user.getNom());
            response.put("prenom", user.getPrenom());
            response.put("email", user.getEmail());
            response.put("role", user.getRole() != null ? user.getRole().name() : null);
            response.put("isResponsable", user.getRole() != null &&
                    user.getRole().name().equals("RESPONSABLE_SOFTWARE"));
            response.put("isTechnicien", user.getRole() != null &&
                    (user.getRole().name().equals("TECHNICIEN_HARDWARE") ||
                            user.getRole().name().equals("TECHNICEN_HARDWARE")));
            response.put("actif", user.getActif());
            response.put("telephone", user.getTelephone());

            log.info("📋 Utilisateur {} {}: rôle = {}, actif = {}",
                    user.getPrenom(), user.getNom(), user.getRole(), user.getActif());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération du rôle: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    // ✅ NOUVEL ENDPOINT - Récupérer un utilisateur par ID
    @GetMapping("/{id}")
    public ResponseEntity<Utilisateur> getUtilisateurById(@PathVariable Integer id) {
        try {
            Utilisateur user = utilisateurRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}