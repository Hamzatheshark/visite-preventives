package com.example.visite.controller;

import com.example.visite.config.PasswordEncoderConfig;
import com.example.visite.model.Utilisateur;
import com.example.visite.model.enums.RoleUtilisateur;
import com.example.visite.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UtilisateurRepository utilisateurRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> payload) {
        try {
            System.out.println("=== INSCRIPTION ===");
            System.out.println("Données reçues: " + payload);

            String nom = (String) payload.get("nom");
            String prenom = (String) payload.get("prenom");
            String email = (String) payload.get("email");
            String motPasse = (String) payload.get("motPasse");
            String telephone = (String) payload.get("telephone");
            String roleStr = (String) payload.get("role");

            // Validation
            if (nom == null || prenom == null || email == null || motPasse == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Tous les champs obligatoires doivent être remplis");
                return ResponseEntity.badRequest().body(error);
            }

            // Vérifier si l'email existe déjà
            if (utilisateurRepository.existsByEmail(email)) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Cet email est déjà utilisé");
                return ResponseEntity.badRequest().body(error);
            }

            // Créer l'utilisateur
            Utilisateur utilisateur = new Utilisateur();
            utilisateur.setNom(nom);
            utilisateur.setPrenom(prenom);
            utilisateur.setEmail(email);
            // Encoder le mot de passe avec notre encodeur
            utilisateur.setMotPasse(PasswordEncoderConfig.encode(motPasse));
            utilisateur.setTelephone(telephone);

            // Définir le rôle
            try {
                if (roleStr != null && !roleStr.isEmpty()) {
                    utilisateur.setRole(RoleUtilisateur.valueOf(roleStr));
                } else {
                    utilisateur.setRole(RoleUtilisateur.TECHNICIEN_HARDWARE);
                }
            } catch (IllegalArgumentException e) {
                utilisateur.setRole(RoleUtilisateur.TECHNICIEN_HARDWARE);
            }

            utilisateur.setActif(true);
            Utilisateur saved = utilisateurRepository.save(utilisateur);
            saved.setMotPasse(null);

            System.out.println("✅ Inscription réussie: " + saved.getEmail());
            System.out.println("Rôle: " + saved.getRole());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Inscription réussie");
            response.put("user", saved);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            System.err.println("❌ ERREUR: " + e.getMessage());
            e.printStackTrace();

            Map<String, String> error = new HashMap<>();
            error.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        try {
            System.out.println("=== CONNEXION ===");
            System.out.println("Email: " + payload.get("email"));

            String email = payload.get("email");
            String motPasse = payload.get("motPasse");

            Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                    .orElse(null);

            if (utilisateur == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Email ou mot de passe incorrect");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            // Vérifier le mot de passe avec notre encodeur
            if (!PasswordEncoderConfig.matches(motPasse, utilisateur.getMotPasse())) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Email ou mot de passe incorrect");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }

            // Construire la réponse avec le rôle
            Map<String, Object> userResponse = new HashMap<>();
            userResponse.put("id", utilisateur.getId());
            userResponse.put("nom", utilisateur.getNom());
            userResponse.put("prenom", utilisateur.getPrenom());
            userResponse.put("email", utilisateur.getEmail());
            userResponse.put("role", utilisateur.getRole().name());
            userResponse.put("telephone", utilisateur.getTelephone());
            userResponse.put("actif", utilisateur.getActif());

            System.out.println("✅ Connexion réussie pour: " + email);
            System.out.println("🔑 Rôle envoyé: " + utilisateur.getRole().name());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Connexion réussie");
            response.put("user", userResponse);
            response.put("token", "dummy-token-" + System.currentTimeMillis());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ ERREUR: " + e.getMessage());
            e.printStackTrace();

            Map<String, String> error = new HashMap<>();
            error.put("message", "Erreur: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}