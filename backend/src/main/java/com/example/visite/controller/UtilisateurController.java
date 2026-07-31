package com.example.visite.controller;

import com.example.visite.dto.UtilisateurDTO;
import com.example.visite.model.Utilisateur;
import com.example.visite.model.enums.RoleUtilisateur;
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

    // ============================================
    // ✅ 1. ROUTES SPÉCIFIQUES (AVANT celles avec {id})
    // ============================================

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> test() {
        long count = utilisateurRepository.count();
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "API utilisateurs fonctionne");
        response.put("count", count);
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/techniciens")
    public ResponseEntity<List<UtilisateurDTO>> getTechniciens() {
        log.info("🔍 Recherche des techniciens actifs...");

        List<Utilisateur> allUsers = utilisateurRepository.findAll();
        log.info("📋 {} utilisateurs trouvés au total", allUsers.size());

        List<UtilisateurDTO> techniciens = allUsers.stream()
                .filter(u -> u.getActif() != null && u.getActif())
                .filter(u -> {
                    if (u.getRole() == null) return false;
                    String role = u.getRole().name();
                    return role.equals("TECHNICIEN_HARDWARE") ||
                            role.equals("TECHNICEN_HARDWARE");
                })
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        log.info("✅ {} technicien(s) trouvé(s)", techniciens.size());

        for (UtilisateurDTO u : techniciens) {
            log.info("   - ID: {}, Nom: {}, Prénom: {}, Rôle: {}",
                    u.getId(), u.getNom(), u.getPrenom(), u.getRole());
        }

        return ResponseEntity.ok(techniciens);
    }

    @GetMapping("/responsables")
    public ResponseEntity<List<UtilisateurDTO>> getResponsables() {
        log.info("🔍 Recherche des responsables actifs...");

        List<Utilisateur> allUsers = utilisateurRepository.findAll();

        List<UtilisateurDTO> responsables = allUsers.stream()
                .filter(u -> u.getActif() != null && u.getActif())
                .filter(u -> {
                    if (u.getRole() == null) return false;
                    String role = u.getRole().name();
                    return role.equals("RESPONSABLE_SOFTWARE");
                })
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        log.info("✅ {} responsable(s) trouvé(s)", responsables.size());

        for (UtilisateurDTO u : responsables) {
            log.info("   - ID: {}, Nom: {}, Prénom: {}, Rôle: {}",
                    u.getId(), u.getNom(), u.getPrenom(), u.getRole());
        }

        return ResponseEntity.ok(responsables);
    }

    // ============================================
    // ✅ 2. ROUTES AVEC {id} (APRÈS les routes spécifiques)
    // ============================================

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

    @GetMapping("/{id}")
    public ResponseEntity<UtilisateurDTO> getUtilisateurById(@PathVariable Integer id) {
        try {
            log.info("🔍 Récupération de l'utilisateur ID: {}", id);

            Utilisateur user = utilisateurRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            log.info("✅ Utilisateur trouvé: {} {}", user.getPrenom(), user.getNom());
            return ResponseEntity.ok(convertToDTO(user));
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    // ============================================
    // ✅ 3. ACTIONS CRUD (MODIFIER, SUPPRIMER, STATUT)
    // ============================================

    /**
     * ✅ MODIFIER un utilisateur
     * PUT /api/utilisateurs/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<UtilisateurDTO> updateUtilisateur(
            @PathVariable Integer id,
            @RequestBody UtilisateurDTO userDTO) {
        try {
            log.info("📝 Modification de l'utilisateur ID: {}", id);

            Utilisateur existingUser = utilisateurRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            log.info("📝 Utilisateur avant modification: {} {}",
                    existingUser.getPrenom(), existingUser.getNom());

            // ✅ Mettre à jour les champs
            if (userDTO.getNom() != null) {
                existingUser.setNom(userDTO.getNom());
            }
            if (userDTO.getPrenom() != null) {
                existingUser.setPrenom(userDTO.getPrenom());
            }
            if (userDTO.getEmail() != null) {
                existingUser.setEmail(userDTO.getEmail());
            }
            if (userDTO.getTelephone() != null) {
                existingUser.setTelephone(userDTO.getTelephone());
            }

            // ✅ Mettre à jour le rôle
            if (userDTO.getRole() != null) {
                try {
                    existingUser.setRole(RoleUtilisateur.valueOf(userDTO.getRole()));
                    log.info("📝 Nouveau rôle: {}", userDTO.getRole());
                } catch (IllegalArgumentException e) {
                    log.warn("⚠️ Rôle invalide: {}", userDTO.getRole());
                }
            }

            // ✅ Mettre à jour le statut
            if (userDTO.getActif() != null) {
                existingUser.setActif(userDTO.getActif());
                log.info("📝 Nouveau statut: {}", userDTO.getActif() ? "Actif" : "Inactif");
            }

            Utilisateur saved = utilisateurRepository.save(existingUser);
            log.info("✅ Utilisateur {} {} modifié avec succès",
                    saved.getPrenom(), saved.getNom());

            return ResponseEntity.ok(convertToDTO(saved));

        } catch (Exception e) {
            log.error("❌ Erreur lors de la modification: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * ✅ SUPPRIMER un utilisateur
     * DELETE /api/utilisateurs/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUtilisateur(@PathVariable Integer id) {
        try {
            log.info("🗑️ Suppression de l'utilisateur ID: {}", id);

            Utilisateur user = utilisateurRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            log.info("🗑️ Utilisateur à supprimer: {} {}", user.getPrenom(), user.getNom());

            // ✅ Vérifier si l'utilisateur a des visites associées
            int nbVisitesTechnicien = user.getVisitesTechnicien() != null ? user.getVisitesTechnicien().size() : 0;
            int nbVisitesResponsable = user.getVisitesResponsable() != null ? user.getVisitesResponsable().size() : 0;

            if (nbVisitesTechnicien > 0 || nbVisitesResponsable > 0) {
                log.warn("⚠️ L'utilisateur a {} visites comme technicien et {} visites comme responsable",
                        nbVisitesTechnicien, nbVisitesResponsable);

                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("message", "Impossible de supprimer cet utilisateur car il a des visites associées");
                errorResponse.put("error", "USER_HAS_VISITS");
                errorResponse.put("visitesTechnicien", String.valueOf(nbVisitesTechnicien));
                errorResponse.put("visitesResponsable", String.valueOf(nbVisitesResponsable));
                return ResponseEntity.badRequest().body(errorResponse);
            }

            utilisateurRepository.delete(user);
            log.info("✅ Utilisateur {} {} supprimé avec succès",
                    user.getPrenom(), user.getNom());

            Map<String, String> response = new HashMap<>();
            response.put("message", "Utilisateur supprimé avec succès");
            response.put("id", id.toString());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Erreur lors de la suppression: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Erreur lors de la suppression: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * ✅ ACTIVER/DÉSACTIVER un utilisateur
     * PUT /api/utilisateurs/{id}/status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<UtilisateurDTO> toggleUserStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, Boolean> payload) {
        try {
            Boolean actif = payload.get("actif");
            if (actif == null) {
                log.warn("⚠️ Le champ 'actif' est manquant dans la requête");
                return ResponseEntity.badRequest().build();
            }

            log.info("🔄 Changement de statut pour l'utilisateur ID: {} -> actif: {}", id, actif);

            Utilisateur user = utilisateurRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            String ancienStatut = user.getActif() ? "Actif" : "Inactif";
            String nouveauStatut = actif ? "Actif" : "Inactif";

            user.setActif(actif);
            Utilisateur saved = utilisateurRepository.save(user);

            log.info("✅ Utilisateur {} {}: {} -> {}",
                    saved.getPrenom(), saved.getNom(),
                    ancienStatut, nouveauStatut);

            return ResponseEntity.ok(convertToDTO(saved));

        } catch (Exception e) {
            log.error("❌ Erreur lors du changement de statut: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // ============================================
    // ✅ 4. ROUTE GÉNÉRALE (EN DERNIER)
    // ============================================

    @GetMapping
    public ResponseEntity<List<UtilisateurDTO>> getAllUtilisateurs() {
        log.info("📋 Récupération de tous les utilisateurs...");

        List<Utilisateur> utilisateurs = utilisateurRepository.findAll();
        log.info("📋 {} utilisateur(s) trouvé(s)", utilisateurs.size());

        List<UtilisateurDTO> dtos = utilisateurs.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        log.info("✅ {} DTO(s) créé(s)", dtos.size());

        for (UtilisateurDTO u : dtos) {
            log.info("   - ID: {}, Nom: {}, Prénom: {}, Rôle: {}, Actif: {}",
                    u.getId(), u.getNom(), u.getPrenom(), u.getRole(), u.getActif());
        }

        return ResponseEntity.ok(dtos);
    }

    // ============================================
    // ✅ 5. MÉTHODE DE CONVERSION
    // ============================================

    private UtilisateurDTO convertToDTO(Utilisateur user) {
        UtilisateurDTO dto = new UtilisateurDTO();
        dto.setId(user.getId());
        dto.setNom(user.getNom());
        dto.setPrenom(user.getPrenom());
        dto.setEmail(user.getEmail());
        dto.setTelephone(user.getTelephone());
        dto.setRole(user.getRole() != null ? user.getRole().name() : null);
        dto.setActif(user.getActif());
        return dto;
    }
}