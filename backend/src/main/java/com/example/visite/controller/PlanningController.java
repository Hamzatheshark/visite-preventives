package com.example.visite.controller;

import com.example.visite.dto.PlanningDTO;
import com.example.visite.model.Planning;
import com.example.visite.model.enums.StatutVisite;
import com.example.visite.service.PlanningService;
import com.example.visite.service.PlanningAutomatiqueService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/plannings")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class PlanningController {

    private final PlanningService planningService;
    private final PlanningAutomatiqueService planningAutomatiqueService;

    // ==================== GET ====================

    @GetMapping
    public ResponseEntity<List<PlanningDTO>> getAllPlannings() {
        List<Planning> plannings = planningService.getAllPlannings();
        // ✅ Utiliser la méthode du service
        List<PlanningDTO> dtos = planningService.convertToDTOList(plannings);
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlanningDTO> getPlanningById(@PathVariable Integer id) {
        Planning planning = planningService.getPlanningById(id);
        // ✅ Utiliser la méthode du service
        return ResponseEntity.ok(planningService.convertToDTO(planning));
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<PlanningDTO>> getPlanningsByStatut(@PathVariable StatutVisite statut) {
        List<Planning> plannings = planningService.getPlanningsByStatut(statut);
        // ✅ Utiliser la méthode du service
        return ResponseEntity.ok(planningService.convertToDTOList(plannings));
    }

    @GetMapping("/site/{siteId}")
    public ResponseEntity<List<PlanningDTO>> getPlanningsBySite(@PathVariable Integer siteId) {
        List<Planning> plannings = planningService.getPlanningsBySite(siteId);
        // ✅ Utiliser la méthode du service
        return ResponseEntity.ok(planningService.convertToDTOList(plannings));
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<PlanningDTO>> getPlanningsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        List<Planning> plannings = planningService.getPlanningsByDateRange(start, end);
        // ✅ Utiliser la méthode du service
        return ResponseEntity.ok(planningService.convertToDTOList(plannings));
    }

    @GetMapping("/sans-pi")
    public ResponseEntity<List<PlanningDTO>> getVisitesSansPI() {
        List<Planning> plannings = planningService.getVisitesSansPI();
        // ✅ Utiliser la méthode du service
        return ResponseEntity.ok(planningService.convertToDTOList(plannings));
    }

    // ==================== POST ====================

    @PostMapping
    public ResponseEntity<Planning> createPlanning(@RequestBody Planning planning) {
        return new ResponseEntity<>(planningService.createPlanning(planning), HttpStatus.CREATED);
    }

    @PostMapping("/planifier/{contratId}")
    public ResponseEntity<Void> planifierAutomatiquement(@PathVariable Integer contratId) {
        planningService.planifierAutomatiquement(contratId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/planifier-client/{clientId}")
    public ResponseEntity<?> planifierPourClient(@PathVariable Integer clientId) {
        try {
            planningAutomatiqueService.planifierVisitesPourClient(clientId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Planification lancée avec succès");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/envoyer/{planningId}")
    public ResponseEntity<Void> envoyerProposition(@PathVariable Integer planningId) {
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

    @PostMapping("/assigner-auto/{planningId}")
    public ResponseEntity<?> assignerTechnicienAuto(@PathVariable Integer planningId) {
        try {
            planningAutomatiqueService.assignerTechnicienAutomatiquement(planningId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Technicien assigné automatiquement avec succès");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/realiser/{planningId}")
    public ResponseEntity<Void> marquerRealise(
            @PathVariable Integer planningId,
            @RequestParam String resultat) {
        planningService.marquerRealise(planningId, resultat);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/procedure/lancer-planification")
    public ResponseEntity<?> lancerPlanification() {
        try {
            int count = planningAutomatiqueService.planifierVisitesPourTousLesClients();
            Map<String, String> response = new HashMap<>();
            response.put("message", "Planification automatique lancée avec succès");
            response.put("visitesCrees", String.valueOf(count));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/procedure/reponse-email")
    public ResponseEntity<?> traiterReponseEmail(
            @RequestParam String contenu,
            @RequestParam Integer planningId) {
        try {
            boolean accepte = contenu.toUpperCase().contains("ACCEPTE") ||
                    contenu.toUpperCase().contains("ACCEPT");
            planningAutomatiqueService.traiterReponseClient(planningId, accepte);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Réponse traitée avec succès");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/procedure/envoyer-propositions")
    public ResponseEntity<?> envoyerPropositions() {
        try {
            List<Planning> visitesEnAttente = planningService.getPlanningsByStatut(StatutVisite.EN_ATTENTE);
            for (Planning planning : visitesEnAttente) {
                if (planning.getDateEnvoi() == null) {
                    planningAutomatiqueService.envoyerProposition(planning.getId());
                }
            }
            Map<String, String> response = new HashMap<>();
            response.put("message", "Propositions envoyées avec succès");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/procedure/verifier-relances")
    public ResponseEntity<?> verifierRelances() {
        try {
            planningAutomatiqueService.verifierRelances();
            Map<String, String> response = new HashMap<>();
            response.put("message", "Vérification des relances effectuée");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // ==================== PUT ====================

    @PutMapping("/{id}")
    public ResponseEntity<Planning> updatePlanning(@PathVariable Integer id, @RequestBody Planning planning) {
        planning.setId(id);
        return ResponseEntity.ok(planningService.updatePlanning(planning));
    }

    // ==================== DELETE ====================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlanning(@PathVariable Integer id) {
        planningService.deletePlanning(id);
        return ResponseEntity.noContent().build();
    }
}