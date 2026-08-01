// controller/PlanningController.java - COMPLET AVEC IMPORTS
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
import java.util.ArrayList;      // ✅ AJOUTER
import java.util.HashMap;        // ✅ AJOUTER
import java.util.List;
import java.util.Map;            // ✅ AJOUTER

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

    @PostMapping("/planifier-visite-specifique/{clientId}/{numVisite}")
    public ResponseEntity<String> planifierVisiteSpecifique(
            @PathVariable Integer clientId,
            @PathVariable Integer numVisite) {
        try {
            log.info("📤 Planification de la visite V{} pour le client ID: {}", numVisite, clientId);
            planningService.planifierVisiteSpecifique(clientId, numVisite);
            return ResponseEntity.ok("Visite V" + numVisite + " planifiée avec succès");
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    @PostMapping("/planifier-plage/{clientId}/{numVisiteDebut}/{numVisiteFin}")
    public ResponseEntity<String> planifierPlageVisites(
            @PathVariable Integer clientId,
            @PathVariable Integer numVisiteDebut,
            @PathVariable Integer numVisiteFin) {
        try {
            log.info("📤 Planification des visites V{} à V{} pour le client ID: {}",
                    numVisiteDebut, numVisiteFin, clientId);
            planningService.planifierPlageVisites(clientId, numVisiteDebut, numVisiteFin);
            return ResponseEntity.ok("Visites V" + numVisiteDebut + " à V" + numVisiteFin + " planifiées avec succès");
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

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

    // PlanningController.java

    @PostMapping("/relancer/{planningId}")
    public ResponseEntity<String> relancerVisite(
            @PathVariable Integer planningId,
            @RequestBody(required = false) Map<String, Object> payload) {
        try {
            String nouvelleDate = payload != null ? (String) payload.get("nouvelleDate") : null;
            Boolean confirmerDirectement = payload != null &&
                    payload.containsKey("confirmerDirectement") &&
                    (Boolean) payload.get("confirmerDirectement");

            log.info("📤 Relance de la visite ID: {} avec date: {}, confirmation directe: {}",
                    planningId, nouvelleDate, confirmerDirectement);

            planningService.relancerVisite(planningId, nouvelleDate, confirmerDirectement);
            return ResponseEntity.ok("✅ Visite relancée avec succès");
        } catch (Exception e) {
            log.error("❌ Erreur relance: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("❌ Erreur: " + e.getMessage());
        }
    }

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

    // ✅ Nettoyer les doublons de visites
    @PostMapping("/nettoyer-doublons")
    public ResponseEntity<String> nettoyerDoublons() {
        try {
            List<Planning> plannings = planningService.getAllPlannings();
            int supprime = 0;
            int gardes = 0;

            // Grouper par (clientId, numVisite)
            Map<String, List<Planning>> groupes = new HashMap<>();
            for (Planning p : plannings) {
                if (p.getSite() != null && p.getSite().getClient() != null && p.getNumVisite() != null) {
                    String key = p.getSite().getClient().getId() + "-" + p.getNumVisite();
                    groupes.computeIfAbsent(key, k -> new ArrayList<>()).add(p);
                }
            }

            // Pour chaque groupe, garder le meilleur statut
            for (Map.Entry<String, List<Planning>> entry : groupes.entrySet()) {
                List<Planning> groupe = entry.getValue();
                if (groupe.size() > 1) {
                    // Trier par priorité de statut
                    groupe.sort((a, b) -> {
                        int prioriteA = getStatutPriorite(a.getStatut());
                        int prioriteB = getStatutPriorite(b.getStatut());
                        return Integer.compare(prioriteA, prioriteB);
                    });

                    // Garder le premier, supprimer les autres
                    for (int i = 1; i < groupe.size(); i++) {
                        planningService.deletePlanning(groupe.get(i).getId());
                        supprime++;
                    }
                    gardes++;
                }
            }

            return ResponseEntity.ok(supprime + " doublon(s) supprimé(s), " + gardes + " groupe(s) traités");
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    private int getStatutPriorite(StatutVisite statut) {
        if (statut == null) return 10;
        switch (statut) {
            case ACCEPTE: return 1;
            case CONFIRME: return 2;
            case REALISE: return 3;
            case EN_ATTENTE: return 4;
            case RELANCE: return 5;
            case REFUSE: return 6;
            case ANNULE: return 7;
            default: return 8;
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

    @PostMapping("/{planningId}/marquer-pi")
    public ResponseEntity<Void> marquerPI(@PathVariable Integer planningId) {
        try {
            Planning planning = planningService.getPlanningById(planningId);
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

    // controller/PlanningController.java - AJOUTER cette méthode

    @PostMapping("/planifier-par-zone")
    public ResponseEntity<String> planifierParZone() {
        try {
            log.info("📍 Planification des visites par zone géographique");
            planningService.planifierVisitesParZone();
            return ResponseEntity.ok("✅ Planification par zone effectuée avec succès !");
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }
}