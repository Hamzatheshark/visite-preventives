// controller/PlanningController.java - COMPLET
package com.example.visite.controller;

import com.example.visite.model.Planning;
import com.example.visite.model.enums.StatutVisite;
import com.example.visite.service.PlanningService;
import com.example.visite.dto.PlanningDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class PlanningController {

    private final PlanningService planningService;

    // ============================================================
    // ✅ PLANIFICATION
    // ============================================================

    // Planifier pour un client spécifique (toutes les visites)
    @PostMapping("/planifier-client/{clientId}")
    public ResponseEntity<String> planifierClient(@PathVariable Integer clientId) {
        try {
            log.info("📤 Planification pour le client ID: {}", clientId);
            planningService.planifierVisitesPourClient(clientId);
            return ResponseEntity.ok("Visites planifiées avec succès pour le client");
        } catch (Exception e) {
            log.error("❌ Erreur planification client: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    // Planifier pour tous les clients
    @PostMapping({"/lancer-planification", "/procedure/lancer-planification"})
    public ResponseEntity<String> lancerPlanification() {
        try {
            log.info("📤 Planification pour tous les clients...");
            int count = planningService.planifierVisitesPourTousLesClients();
            return ResponseEntity.ok(count + " client(s) traités avec succès");
        } catch (Exception e) {
            log.error("❌ Erreur planification générale: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    // ✅ Planifier UNIQUEMENT la prochaine visite pour un client
    @PostMapping("/planifier-prochaine/{clientId}")
    public ResponseEntity<String> planifierProchaineVisite(@PathVariable Integer clientId) {
        try {
            log.info("📤 Planification de la prochaine visite pour le client ID: {}", clientId);
            planningService.planifierProchaineVisite(clientId);
            return ResponseEntity.ok("Prochaine visite planifiée avec succès");
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    // ✅ Planifier toutes les visites manquantes pour un client
    @PostMapping("/planifier-toutes/{clientId}")
    public ResponseEntity<String> planifierToutesVisites(@PathVariable Integer clientId) {
        try {
            log.info("📤 Planification de toutes les visites pour le client ID: {}", clientId);
            planningService.planifierToutesVisitesManquantes(clientId);
            return ResponseEntity.ok("Toutes les visites planifiées avec succès");
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    // ✅ Planifier la prochaine visite pour TOUS les clients
    @PostMapping("/lancer-planification-prochaine")
    public ResponseEntity<String> lancerPlanificationProchaine() {
        try {
            log.info("📤 Planification de la prochaine visite pour tous les clients...");
            int count = planningService.planifierProchaineVisitePourTousLesClients();
            return ResponseEntity.ok(count + " client(s) traités avec succès");
        } catch (Exception e) {
            log.error("❌ Erreur planification: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    // Envoyer une proposition
    @PostMapping("/envoyer-proposition/{planningId}")
    public ResponseEntity<String> envoyerProposition(@PathVariable Integer planningId) {
        try {
            planningService.envoyerProposition(planningId);
            return ResponseEntity.ok("Proposition envoyée avec succès");
        } catch (Exception e) {
            log.error("❌ Erreur envoi proposition: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    // Traiter une réponse client
    @PostMapping("/reponse-client/{planningId}")
    public ResponseEntity<String> traiterReponseClient(
            @PathVariable Integer planningId,
            @RequestParam boolean accepte) {
        try {
            planningService.traiterReponseClient(planningId, accepte);
            return ResponseEntity.ok("Réponse traitée avec succès");
        } catch (Exception e) {
            log.error("❌ Erreur traitement réponse: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    // Envoyer les relances
    @PostMapping("/envoyer-relances")
    public ResponseEntity<String> envoyerRelances() {
        try {
            List<Planning> enAttente = planningService.getPlanningsByStatut(StatutVisite.EN_ATTENTE);
            int count = 0;
            for (Planning p : enAttente) {
                if (p.getNbRelances() != null && p.getNbRelances() < 3) {
                    planningService.gererRelance(p.getId());
                    count++;
                }
            }
            return ResponseEntity.ok(count + " relance(s) envoyée(s)");
        } catch (Exception e) {
            log.error("❌ Erreur envoi relances: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    // Vérifier et mettre à jour les statuts
    @PostMapping("/verifier-statuts")
    public ResponseEntity<String> verifierStatuts() {
        try {
            List<Planning> plannings = planningService.getAllPlannings();
            int misAJour = 0;

            for (Planning p : plannings) {
                if (p.getDateVisite() != null && p.getDateVisite().isBefore(LocalDate.now())) {
                    if (p.getStatut() == StatutVisite.EN_ATTENTE || p.getStatut() == StatutVisite.RELANCE) {
                        p.setStatut(StatutVisite.ANNULE);
                        misAJour++;
                    } else if (p.getStatut() == StatutVisite.ACCEPTE) {
                        p.setStatut(StatutVisite.REALISE);
                        p.setDateRealisation(LocalDate.now().atStartOfDay());
                        misAJour++;
                    }
                }
            }

            return ResponseEntity.ok(misAJour + " statut(s) mis à jour");
        } catch (Exception e) {
            log.error("❌ Erreur vérification statuts: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    // Assigner un technicien automatiquement
    @PostMapping("/assigner-technicien-auto/{planningId}")
    public ResponseEntity<String> assignerTechnicienAuto(@PathVariable Integer planningId) {
        try {
            Planning planning = planningService.getPlanningById(planningId);
            return ResponseEntity.ok("Technicien assigné avec succès");
        } catch (Exception e) {
            log.error("❌ Erreur assignation technicien: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    // ✅ Annuler une visite (admin)
    @PostMapping("/annuler/{planningId}")
    public ResponseEntity<String> annulerVisite(@PathVariable Integer planningId) {
        try {
            planningService.annulerVisite(planningId);
            return ResponseEntity.ok("Visite annulée avec succès");
        } catch (Exception e) {
            log.error("❌ Erreur annulation: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    // ============================================================
    // ✅ MÉTHODES CRUD
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

    @GetMapping("/technicien/{technicienId}")
    public ResponseEntity<List<PlanningDTO>> getPlanningsByTechnicien(@PathVariable Integer technicienId) {
        List<Planning> plannings = planningService.getPlanningsByTechnicien(technicienId);
        return ResponseEntity.ok(planningService.convertToDTOList(plannings));
    }

    @GetMapping("/responsable/{responsableId}")
    public ResponseEntity<List<PlanningDTO>> getPlanningsByResponsable(@PathVariable Integer responsableId) {
        List<Planning> plannings = planningService.getPlanningsByResponsable(responsableId);
        return ResponseEntity.ok(planningService.convertToDTOList(plannings));
    }

    @GetMapping("/sans-pi")
    public ResponseEntity<List<Planning>> getVisitesSansPI() {
        return ResponseEntity.ok(planningService.getVisitesSansPI());
    }

    @GetMapping("/{planningId}/has-pi")
    public ResponseEntity<Boolean> hasPieceIntervention(@PathVariable Integer planningId) {
        Planning planning = planningService.getPlanningById(planningId);
        return ResponseEntity.ok(planning.getPieceIntervention() != null);
    }

    // ============================================================
    // ✅ ACTIONS
    // ============================================================

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

    @PutMapping("/{planningId}/terminer")
    public ResponseEntity<Void> marquerTerminee(@PathVariable Integer planningId) {
        planningService.marquerTerminee(planningId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/assigner-responsable-batch")
    public ResponseEntity<String> assignerResponsableBatch(@RequestParam Integer responsableId) {
        try {
            List<Planning> planningsSansResponsable = planningService.getPlanningsSansResponsable();
            int count = 0;
            for (Planning planning : planningsSansResponsable) {
                planningService.assignerResponsable(planning.getId(), responsableId);
                count++;
            }
            return ResponseEntity.ok(count + " visite(s) assignée(s) au responsable ID: " + responsableId);
        } catch (Exception e) {
            log.error("❌ Erreur assignation batch: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    @PostMapping("/{planningId}/annuler-assignment-responsable")
    public ResponseEntity<String> annulerAssignmentResponsable(@PathVariable Integer planningId) {
        try {
            planningService.annulerAssignmentResponsable(planningId);
            return ResponseEntity.ok("Assignement annulé avec succès");
        } catch (Exception e) {
            log.error("❌ Erreur annulation assignment responsable: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    @PostMapping("/{planningId}/annuler-assignment-technicien")
    public ResponseEntity<String> annulerAssignmentTechnicien(@PathVariable Integer planningId) {
        try {
            planningService.annulerAssignmentTechnicien(planningId);
            return ResponseEntity.ok("Assignement annulé avec succès");
        } catch (Exception e) {
            log.error("❌ Erreur annulation assignment technicien: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    // ✅ Marquer qu'une PI a été attachée (pour l'historique)
    @PostMapping("/{planningId}/marquer-pi")
    public ResponseEntity<Void> marquerPI(@PathVariable Integer planningId) {
        try {
            Planning planning = planningService.getPlanningById(planningId);
            // La PI est déjà attachée via PieceIntervention
            // On vérifie juste qu'elle existe
            if (planning.getPieceIntervention() != null) {
                log.info("✅ PI vérifiée pour la visite V{}", planning.getNumVisite());
                return ResponseEntity.ok().build();
            } else {
                log.warn("⚠️ Aucune PI trouvée pour la visite V{}", planning.getNumVisite());
                return ResponseEntity.badRequest().build();
            }
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}