// controller/PlanningController.java
package com.example.visite.controller;

import com.example.visite.model.Planning;
import com.example.visite.model.enums.StatutVisite;
import com.example.visite.service.PlanningService;
import com.example.visite.service.PlanningAutomatiqueService;
import com.example.visite.dto.PlanningDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/plannings")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class PlanningController {

    private final PlanningService planningService;
    private final PlanningAutomatiqueService planningAutomatiqueService; // ✅ AJOUT

    // ============================================================
    // ✅ PLANIFICATION AUTOMATIQUE
    // ============================================================

    // ✅ Planifier pour un client spécifique (utilise PlanningAutomatiqueService)
    @PostMapping("/planifier-client/{clientId}")
    public ResponseEntity<String> planifierClient(@PathVariable Integer clientId) {
        try {
            System.out.println("📤 Planification pour le client ID: " + clientId);
            List<Planning> plannings = planningAutomatiqueService.planifierVisitesPourClient(clientId);

            if (plannings.isEmpty()) {
                return ResponseEntity.ok("Aucune visite à planifier pour ce client");
            }

            return ResponseEntity.ok(plannings.size() + " visite(s) planifiée(s) avec succès");
        } catch (Exception e) {
            System.err.println("❌ Erreur planification client: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    // ✅ Planifier pour tous les clients (utilise PlanningAutomatiqueService)
    @PostMapping("/procedure/lancer-planification")
    public ResponseEntity<String> lancerPlanification() {
        try {
            System.out.println("📤 Planification automatique pour tous les clients...");
            int count = planningAutomatiqueService.planifierVisitesPourTousLesClients();
            return ResponseEntity.ok(count + " visite(s) planifiée(s) pour tous les clients");
        } catch (Exception e) {
            System.err.println("❌ Erreur planification générale: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    // ✅ Envoyer une proposition (utilise PlanningAutomatiqueService)
    @PostMapping("/envoyer-proposition/{planningId}")
    public ResponseEntity<String> envoyerProposition(@PathVariable Integer planningId) {
        try {
            planningAutomatiqueService.envoyerProposition(planningId);
            return ResponseEntity.ok("Proposition envoyée avec succès");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    // ✅ Traiter une réponse client (utilise PlanningAutomatiqueService)
    @PostMapping("/reponse-client/{planningId}")
    public ResponseEntity<String> traiterReponseClient(
            @PathVariable Integer planningId,
            @RequestParam boolean accepte) {
        try {
            boolean result = planningAutomatiqueService.traiterReponseClient(planningId, accepte);
            return ResponseEntity.ok(result ? "Réponse traitée avec succès" : "Erreur lors du traitement");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    // ✅ Envoyer les relances (utilise PlanningAutomatiqueService)
    @PostMapping("/envoyer-relances")
    public ResponseEntity<String> envoyerRelances() {
        try {
            int count = planningAutomatiqueService.envoyerRelances();
            return ResponseEntity.ok(count + " relance(s) envoyée(s)");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    // ✅ Vérifier et mettre à jour les statuts (utilise PlanningAutomatiqueService)
    @PostMapping("/verifier-statuts")
    public ResponseEntity<String> verifierStatuts() {
        try {
            planningAutomatiqueService.verifierEtMettreAJourStatuts();
            return ResponseEntity.ok("Statuts mis à jour avec succès");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    // ✅ Vérifier les relances (utilise PlanningAutomatiqueService)
    @PostMapping("/verifier-relances")
    public ResponseEntity<String> verifierRelances() {
        try {
            planningAutomatiqueService.verifierRelances();
            return ResponseEntity.ok("Relances vérifiées avec succès");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    // ✅ Assigner un technicien automatiquement (utilise PlanningAutomatiqueService)
    @PostMapping("/assigner-technicien-auto/{planningId}")
    public ResponseEntity<String> assignerTechnicienAuto(@PathVariable Integer planningId) {
        try {
            Planning planning = planningAutomatiqueService.assignerTechnicienAutomatiquement(planningId);
            return ResponseEntity.ok("Technicien assigné avec succès");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    // ============================================================
    // ✅ MÉTHODES EXISTANTES (GET)
    // ============================================================

    @GetMapping
    public ResponseEntity<List<PlanningDTO>> getAllPlannings() {
        List<Planning> plannings = planningService.getAllPlannings();
        return ResponseEntity.ok(planningService.convertToDTOList(plannings));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlanningDTO> getPlanningById(@PathVariable Integer id) {
        Planning planning = planningService.getPlanningById(id);
        return ResponseEntity.ok(planningService.convertToDTO(planning));
    }

    @PostMapping
    public ResponseEntity<Planning> createPlanning(@RequestBody Planning planning) {
        return new ResponseEntity<>(planningService.createPlanning(planning), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Planning> updatePlanning(@PathVariable Integer id, @RequestBody Planning planning) {
        planning.setId(id);
        return ResponseEntity.ok(planningService.updatePlanning(planning));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlanning(@PathVariable Integer id) {
        planningService.deletePlanning(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<PlanningDTO>> getPlanningsByStatut(@PathVariable StatutVisite statut) {
        List<Planning> plannings = planningService.getPlanningsByStatut(statut);
        return ResponseEntity.ok(planningService.convertToDTOList(plannings));
    }

    @GetMapping("/site/{siteId}")
    public ResponseEntity<List<Planning>> getPlanningsBySite(@PathVariable Integer siteId) {
        return ResponseEntity.ok(planningService.getPlanningsBySite(siteId));
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<Planning>> getPlanningsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(planningService.getPlanningsByDateRange(start, end));
    }

    // ============================================================
    // ✅ MÉTHODES EXISTANTES (POST - conservées pour compatibilité)
    // ============================================================

    @PostMapping("/planifier/{contratId}")
    public ResponseEntity<Void> planifierAutomatiquement(@PathVariable Integer contratId) {
        planningService.planifierAutomatiquement(contratId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/envoyer/{planningId}")
    public ResponseEntity<Void> envoyerPropositionOld(@PathVariable Integer planningId) {
        planningService.envoyerProposition(planningId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reponse/{planningId}")
    public ResponseEntity<Void> traiterReponse(
            @PathVariable Integer planningId,
            @RequestParam boolean accepte) {
        planningService.traiterReponseClient(planningId, accepte);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/relance/{planningId}")
    public ResponseEntity<Void> gererRelance(@PathVariable Integer planningId) {
        planningService.gererRelance(planningId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/assigner-technicien/{planningId}")
    public ResponseEntity<Void> assignerTechnicien(
            @PathVariable Integer planningId,
            @RequestParam Integer technicienId) {
        planningService.assignerTechnicien(planningId, technicienId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/assigner-responsable/{planningId}")
    public ResponseEntity<Void> assignerResponsable(
            @PathVariable Integer planningId,
            @RequestParam Integer responsableId) {
        planningService.assignerResponsable(planningId, responsableId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/realiser/{planningId}")
    public ResponseEntity<Void> marquerRealise(
            @PathVariable Integer planningId,
            @RequestParam String resultat) {
        planningService.marquerRealise(planningId, resultat);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/sans-pi")
    public ResponseEntity<List<Planning>> getVisitesSansPI() {
        return ResponseEntity.ok(planningService.getVisitesSansPI());
    }
}