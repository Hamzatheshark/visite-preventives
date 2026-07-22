// service/impl/PlanningServiceImpl.java
package com.example.visite.service.impl;

import com.example.visite.model.*;
import com.example.visite.model.enums.StatutVisite;
import com.example.visite.repository.*;
import com.example.visite.service.PlanningService;
import com.example.visite.service.EmailService;
import com.example.visite.dto.PlanningDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlanningServiceImpl implements PlanningService {

    private final PlanningRepository planningRepository;
    private final ContratRepository contratRepository;
    private final SiteRepository siteRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final EmailService emailService;

    @Value("${app.delai-reponse-jours:7}")
    private int delaiReponseJours;

    @Value("${app.nb-relances-max:2}")
    private int nbRelancesMax;

    @Override
    @Transactional
    public Planning createPlanning(Planning planning) {
        validatePlanning(planning);
        return planningRepository.save(planning);
    }

    @Override
    @Transactional
    public Planning updatePlanning(Planning planning) {
        return planningRepository.save(planning);
    }

    @Override
    @Transactional
    public void deletePlanning(Integer id) {
        planningRepository.deleteById(id);
    }

    @Override
    public Planning getPlanningById(Integer id) {
        return planningRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Planning not found with id: " + id));
    }

    @Override
    public List<Planning> getAllPlannings() {
        log.info("📋 Récupération de tous les plannings avec détails...");
        List<Planning> plannings = planningRepository.findAll();

        // Log pour vérifier les données
        for (Planning p : plannings) {
            log.info("📊 Planning V{}: Technicien={}, Responsable={}",
                    p.getNumVisite(),
                    p.getTechnicien() != null ? p.getTechnicien().getNom() : "null",
                    p.getResponsable() != null ? p.getResponsable().getNom() : "null");
        }

        return plannings;
    }

    @Override
    public List<Planning> getPlanningsByStatut(StatutVisite statut) {
        return planningRepository.findByStatut(statut);
    }

    @Override
    public List<Planning> getPlanningsBySite(Integer siteId) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new RuntimeException("Site not found"));
        return planningRepository.findBySiteAndStatut(site, null);
    }

    @Override
    public List<Planning> getPlanningsByDateRange(LocalDate start, LocalDate end) {
        return planningRepository.findByDateVisiteBetween(start, end);
    }

    @Override
    @Transactional
    public void planifierAutomatiquement(Integer contratId) {
        try {
            Contrat contrat = contratRepository.findById(contratId)
                    .orElseThrow(() -> new RuntimeException("Contrat not found"));

            int nbVisites = contrat.getNbVisitesAn() != null ? contrat.getNbVisitesAn() : 2;
            int moisInterval = nbVisites == 4 ? 3 : 6;

            LocalDate dateDebut = contrat.getDateDebut();

            for (int i = 0; i < nbVisites; i++) {
                LocalDate dateProposee = dateDebut.plusMonths((long) i * moisInterval);
                while (dateProposee.getDayOfWeek().getValue() > 5) {
                    dateProposee = dateProposee.plusDays(1);
                }

                List<Site> sites = siteRepository.findByClientId(contrat.getClient().getId());
                if (!sites.isEmpty()) {
                    Site site = sites.get(0);
                    if (planningRepository.existsBySiteAndDateVisite(site, dateProposee)) {
                        dateProposee = dateProposee.plusDays(1);
                    }

                    Planning planning = new Planning();
                    planning.setSite(site);
                    planning.setContrat(contrat);
                    planning.setNumVisite(i + 1);
                    planning.setDateProposee(dateProposee);
                    planning.setStatut(StatutVisite.EN_ATTENTE);
                    planning.setDateEnvoi(LocalDateTime.now());
                    planning.setNbRelances(0);

                    planningRepository.save(planning);
                    envoyerProposition(planning.getId());
                }
            }
        } catch (Exception e) {
            log.error("Error planning visits for contratId: " + contratId, e);
            throw new RuntimeException("Failed to plan visits", e);
        }
    }

    @Override
    @Transactional
    public void envoyerProposition(Integer planningId) {
        try {
            Planning planning = getPlanningById(planningId);
            planning.setDateEnvoi(LocalDateTime.now());
            planning.setStatut(StatutVisite.EN_ATTENTE);
            planningRepository.save(planning);

            emailService.sendPropositionEmail(planning);
        } catch (Exception e) {
            log.error("Error sending proposition for planningId: " + planningId, e);
            throw new RuntimeException("Failed to send proposition", e);
        }
    }

    @Override
    @Transactional
    public void traiterReponseClient(Integer planningId, boolean accepte) {
        try {
            Planning planning = getPlanningById(planningId);
            planning.setDateReponse(LocalDateTime.now());

            if (accepte) {
                planning.setStatut(StatutVisite.ACCEPTE);
                planning.setDateConfirmee(planning.getDateProposee());
                planning.setDateVisite(planning.getDateProposee());
                emailService.sendConfirmationEmail(planning);
            } else {
                planning.setStatut(StatutVisite.REFUSE);
                LocalDate nouvelleDate = planning.getDateProposee().plusDays(7);
                planning.setDateProposee(nouvelleDate);
                planning.setStatut(StatutVisite.EN_ATTENTE);
                planning.setNbRelances(0);
                planningRepository.save(planning);
                envoyerProposition(planningId);
            }
            planningRepository.save(planning);
        } catch (Exception e) {
            log.error("Error processing response for planningId: " + planningId, e);
            throw new RuntimeException("Failed to process response", e);
        }
    }

    @Override
    @Transactional
    public void gererRelance(Integer planningId) {
        try {
            Planning planning = getPlanningById(planningId);

            if (planning.getNbRelances() == null) {
                planning.setNbRelances(0);
            }

            if (planning.getNbRelances() >= nbRelancesMax) {
                planning.setStatut(StatutVisite.RELANCE);
                emailService.sendEscaladeNotification(planning);
            } else {
                planning.setNbRelances(planning.getNbRelances() + 1);
                planning.setDateRelance(LocalDateTime.now());
                planning.setStatut(StatutVisite.RELANCE);
                emailService.sendRelanceEmail(planning);
            }
            planningRepository.save(planning);
        } catch (Exception e) {
            log.error("Error sending relance for planningId: " + planningId, e);
            throw new RuntimeException("Failed to send relance", e);
        }
    }

    @Override
    @Transactional
    public void assignerTechnicien(Integer planningId, Integer technicienId) {
        try {
            Planning planning = getPlanningById(planningId);
            Utilisateur technicien = utilisateurRepository.findById(technicienId)
                    .orElseThrow(() -> new RuntimeException("Technicien not found"));
            planning.setTechnicien(technicien);
            planningRepository.save(planning);
            log.info("🔧 Technicien {} {} assigné à la visite V{}",
                    technicien.getPrenom(), technicien.getNom(), planning.getNumVisite());
        } catch (Exception e) {
            log.error("Error assigning technician for planningId: " + planningId, e);
            throw new RuntimeException("Failed to assign technician", e);
        }
    }

    @Override
    @Transactional
    public void assignerResponsable(Integer planningId, Integer responsableId) {
        try {
            Planning planning = getPlanningById(planningId);
            Utilisateur responsable = utilisateurRepository.findById(responsableId)
                    .orElseThrow(() -> new RuntimeException("Responsable not found"));
            planning.setResponsable(responsable);
            planningRepository.save(planning);
            log.info("👤 Responsable {} {} assigné à la visite V{}",
                    responsable.getPrenom(), responsable.getNom(), planning.getNumVisite());
        } catch (Exception e) {
            log.error("Error assigning responsable for planningId: " + planningId, e);
            throw new RuntimeException("Failed to assign responsable", e);
        }
    }

    @Override
    @Transactional
    public void marquerRealise(Integer planningId, String resultat) {
        try {
            Planning planning = getPlanningById(planningId);
            planning.setStatut(StatutVisite.REALISE);
            planning.setResultat(resultat);
            planning.setDateRealisation(LocalDateTime.now());
            planningRepository.save(planning);
        } catch (Exception e) {
            log.error("Error marking visit as realized for planningId: " + planningId, e);
            throw new RuntimeException("Failed to mark visit as realized", e);
        }
    }

    @Override
    public List<Planning> getVisitesSansPI() {
        try {
            return planningRepository.findVisitesWithoutPI();
        } catch (Exception e) {
            log.error("Error getting visits without PI", e);
            throw new RuntimeException("Failed to get visits without PI", e);
        }
    }

    private void validatePlanning(Planning planning) {
        if (planning.getDateProposee() != null && planning.getDateProposee().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("La date de visite doit être future");
        }
    }

    // ============================================================
    // CONVERSION EN DTO
    // ============================================================

    @Override
    public PlanningDTO convertToDTO(Planning planning) {
        log.info("🔄 Conversion en DTO pour la visite V{}", planning.getNumVisite());

        PlanningDTO dto = new PlanningDTO();
        dto.setId(planning.getId());
        dto.setNumVisite(planning.getNumVisite());
        dto.setDateProposee(planning.getDateProposee());
        dto.setDateConfirmee(planning.getDateConfirmee());
        dto.setDateVisite(planning.getDateVisite());
        dto.setStatut(planning.getStatut() != null ? planning.getStatut().name() : null);
        dto.setDateEnvoi(planning.getDateEnvoi());
        dto.setDateReponse(planning.getDateReponse());
        dto.setNbRelances(planning.getNbRelances());
        dto.setDateRelance(planning.getDateRelance());
        dto.setResultat(planning.getResultat());
        dto.setDateRealisation(planning.getDateRealisation());

        // Client
        if (planning.getSite() != null && planning.getSite().getClient() != null) {
            Client client = planning.getSite().getClient();
            dto.setClientId(client.getId());
            dto.setClientNom(client.getNom());
            dto.setClientEmail(client.getEmailContact());
            dto.setClientCode(client.getCode());
        }

        // Site
        if (planning.getSite() != null) {
            Site site = planning.getSite();
            dto.setSiteId(site.getId());
            dto.setSiteNom(site.getNom());
            dto.setSiteAdresse(site.getAdresse());
            dto.setSiteEmailContact(site.getEmailContact());
            dto.setSiteTelephone(site.getTelephone());
        }

        // Technicien
        if (planning.getTechnicien() != null) {
            Utilisateur tech = planning.getTechnicien();
            dto.setTechnicienId(tech.getId());
            dto.setTechnicienNom(tech.getNom() + " " + tech.getPrenom());
            dto.setTechnicienPrenom(tech.getPrenom());
            dto.setTechnicienEmail(tech.getEmail());
            log.info("🔧 Technicien trouvé pour V{}: {}", planning.getNumVisite(), dto.getTechnicienNom());
        } else {
            log.info("⚠️ Aucun technicien pour V{}", planning.getNumVisite());
        }

        // Responsable
        if (planning.getResponsable() != null) {
            Utilisateur resp = planning.getResponsable();
            dto.setResponsableId(resp.getId());
            dto.setResponsableNom(resp.getNom() + " " + resp.getPrenom());
            dto.setResponsablePrenom(resp.getPrenom());
            dto.setResponsableEmail(resp.getEmail());
            log.info("👤 Responsable trouvé pour V{}: {}", planning.getNumVisite(), dto.getResponsableNom());
        } else {
            log.info("⚠️ Aucun responsable pour V{}", planning.getNumVisite());
        }

        // Contrat
        if (planning.getContrat() != null) {
            Contrat contrat = planning.getContrat();
            dto.setContratId(contrat.getId());
            dto.setContratDateDebut(contrat.getDateDebut());
            dto.setContratDateFin(contrat.getDateFin());
            dto.setNbVisitesAn(contrat.getNbVisitesAn());
        }

        // PI
        dto.setHasPieceIntervention(planning.getPieceIntervention() != null);
        if (planning.getPieceIntervention() != null) {
            dto.setPieceInterventionId(planning.getPieceIntervention().getId());
        }

        log.info("✅ DTO créé pour V{}: Technicien={}, Responsable={}",
                planning.getNumVisite(),
                dto.getTechnicienNom() != null ? dto.getTechnicienNom() : "Non assigné",
                dto.getResponsableNom() != null ? dto.getResponsableNom() : "Non assigné");

        return dto;
    }

    @Override
    public List<PlanningDTO> convertToDTOList(List<Planning> plannings) {
        log.info("🔄 Conversion de {} planning(s) en DTO", plannings.size());
        return plannings.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
}