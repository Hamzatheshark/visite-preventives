package com.example.visite.controller;

import com.example.visite.model.Utilisateur;
import com.example.visite.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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

        // ✅ IGNORER findTechniciensActifs() et utiliser findAll() + filtre
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

        // ✅ Afficher les techniciens trouvés dans les logs
        for (Utilisateur u : techniciens) {
            log.info("   - ID: {}, Nom: {}, Prénom: {}, Rôle: {}",
                    u.getId(), u.getNom(), u.getPrenom(), u.getRole());
        }

        return ResponseEntity.ok(techniciens);
    }

    @GetMapping("/responsables")
    public ResponseEntity<List<Utilisateur>> getResponsables() {
        log.info("🔍 Recherche des responsables actifs...");

        // ✅ IGNORER findResponsablesActifs() et utiliser findAll() + filtre
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
}