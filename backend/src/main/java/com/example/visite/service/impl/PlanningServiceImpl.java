// service/impl/PlanningServiceImpl.java - COMPLET
package com.example.visite.service.impl;

import com.example.visite.model.*;
import com.example.visite.model.enums.StatutVisite;
import com.example.visite.model.enums.RoleUtilisateur;
import com.example.visite.repository.*;
import com.example.visite.service.PlanningService;
import com.example.visite.service.EmailService;
import com.example.visite.service.NotificationService;
import com.example.visite.service.GeocodingService;
import com.example.visite.service.RouteOptimizationService;
import com.example.visite.service.TourneeOptimizationService;
import com.example.visite.service.HolidayService;
import com.example.visite.dto.PlanningDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlanningServiceImpl implements PlanningService {

    private final PlanningRepository planningRepository;
    private final SiteRepository siteRepository;
    private final ClientRepository clientRepository;
    private final ContratRepository contratRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final RouteOptimizationService routeOptimizationService;
    private final GeocodingService geocodingService;
    private final TourneeOptimizationService tourneeOptimizationService;
    private final HolidayService holidayService; // ✅ AJOUTER

    @Value("${planning.nb-relances-max:2}")
    private int nbRelancesMax;

    @Value("${planning.rayon-regroupement-km:50}")
    private double rayonRegroupementKm;

    // ============================================================
    // ✅ PLANIFICATION
    // ============================================================

    @Override
    @Transactional
    public void planifierVisitesPourClient(Integer clientId) {
        log.info("📅 Planification pour le client ID: {}", clientId);

        try {
            Client client = clientRepository.findById(clientId)
                    .orElseThrow(() -> new RuntimeException("Client non trouvé"));

            List<Site> sites = siteRepository.findByClientIdAndActifTrue(clientId);
            if (sites.isEmpty()) {
                log.warn("⚠️ Aucun site actif pour le client {}", client.getNom());
                throw new RuntimeException("Le client n'a pas de site actif");
            }

            int totalCrees = 0;

            List<Contrat> contrats = contratRepository.findByClientIdAndActifTrue(clientId);

            if (!contrats.isEmpty()) {
                log.info("📋 {} contrat(s) actif(s) trouvé(s) pour le client {}", contrats.size(), client.getNom());
                for (Contrat contrat : contrats) {
                    totalCrees += planifierVisitesPourContrat(contrat);
                }
            } else {
                log.info("📋 Aucun contrat actif, utilisation des données du client");

                Integer nbVisitesAn = client.getNbVisitesAn();
                if (nbVisitesAn == null || nbVisitesAn <= 0) {
                    log.warn("⚠️ Le client {} n'a pas de nombre de visites par an défini", client.getNom());
                    throw new RuntimeException("Le client n'a pas de nombre de visites par an défini");
                }

                totalCrees = planifierVisitesPourClientSansContrat(client, sites, nbVisitesAn);
            }

            log.info("✅ {} visite(s) planifiée(s) pour le client {}", totalCrees, client.getNom());

        } catch (Exception e) {
            log.error("❌ Erreur lors de la planification: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la planification: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public int planifierVisitesPourTousLesClients() {
        log.info("📅 Planification pour tous les clients");

        List<Client> clients = clientRepository.findByActifTrue();
        int totalCrees = 0;

        for (Client client : clients) {
            try {
                planifierVisitesPourClient(client.getId());
                totalCrees++;
            } catch (Exception e) {
                log.error("❌ Erreur pour le client {}: {}", client.getNom(), e.getMessage());
            }
        }

        log.info("✅ Planification terminée pour {} clients", totalCrees);
        return totalCrees;
    }

    // ✅ PLANIFIER UNIQUEMENT LA PROCHAINE VISITE
    @Override
    @Transactional
    public void planifierProchaineVisite(Integer clientId) {
        log.info("📅 Planification de la prochaine visite pour le client ID: {}", clientId);

        try {
            Client client = clientRepository.findById(clientId)
                    .orElseThrow(() -> new RuntimeException("Client non trouvé"));

            List<Site> sites = siteRepository.findByClientIdAndActifTrue(clientId);
            if (sites.isEmpty()) {
                throw new RuntimeException("Le client n'a pas de site actif");
            }

            int prochainNumVisite = getProchainNumVisite(clientId, sites);

            int nbVisitesAn = client.getNbVisitesAn() != null ? client.getNbVisitesAn() : 4;
            if (prochainNumVisite > nbVisitesAn) {
                log.warn("⚠️ Client {} a déjà {} visites, maximum atteint", client.getNom(), nbVisitesAn);
                throw new RuntimeException("Toutes les visites de l'année sont déjà planifiées");
            }

            LocalDate dateProchaineVisite = calculerDateProchaineVisite(client, prochainNumVisite);

            Planning planning = new Planning();
            planning.setSite(sites.get(0));
            planning.setContrat(null);
            planning.setNumVisite(prochainNumVisite);
            planning.setStatut(StatutVisite.EN_ATTENTE);
            planning.setNbRelances(0);
            planning.setDateEnvoi(LocalDateTime.now());
            planning.setDateProposee(dateProchaineVisite);
            planning.setDateVisite(dateProchaineVisite);

            Planning saved = planningRepository.save(planning);

            log.info("✅ Visite V{} planifiée pour le client {} le {}",
                    prochainNumVisite, client.getNom(), dateProchaineVisite);

            try {
                envoyerProposition(saved.getId());
                log.info("📧 Email envoyé pour la visite V{}", saved.getNumVisite());
            } catch (Exception e) {
                log.error("❌ Erreur lors de l'envoi de l'email: {}", e.getMessage());
            }

        } catch (Exception e) {
            log.error("❌ Erreur lors de la planification: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la planification: " + e.getMessage());
        }
    }

    // ✅ PLANIFIER TOUTES LES VISITES MANQUANTES
    @Override
    @Transactional
    public void planifierToutesVisitesManquantes(Integer clientId) {
        log.info("📅 Planification de toutes les visites manquantes pour le client ID: {}", clientId);

        try {
            Client client = clientRepository.findById(clientId)
                    .orElseThrow(() -> new RuntimeException("Client non trouvé"));

            int nbVisitesAn = client.getNbVisitesAn() != null ? client.getNbVisitesAn() : 4;

            for (int i = 1; i <= nbVisitesAn; i++) {
                try {
                    if (!visiteExiste(clientId, i)) {
                        planifierProchaineVisite(clientId);
                        log.info("✅ Visite V{} planifiée", i);
                    } else {
                        log.info("ℹ️ Visite V{} déjà planifiée", i);
                    }
                } catch (Exception e) {
                    log.error("❌ Erreur lors de la planification de V{}: {}", i, e.getMessage());
                    break;
                }
            }

        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur: " + e.getMessage());
        }
    }

    /**
     * Planifier les visites avec un contrat
     */
    private int planifierVisitesPourContrat(Contrat contrat) {
        int nbVisites = contrat.getNbVisitesAn() != null ? contrat.getNbVisitesAn() : 2;
        int moisInterval = nbVisites == 4 ? 3 : 6;
        LocalDate dateDebut = contrat.getDateDebut() != null ? contrat.getDateDebut() : LocalDate.now();

        // Trouver la première date valide
        dateDebut = holidayService.findNextValidDate(dateDebut);

        List<Site> sites = siteRepository.findByClientIdAndActifTrue(contrat.getClient().getId());
        if (sites.isEmpty()) {
            log.warn("⚠️ Aucun site pour le contrat {}", contrat.getId());
            return 0;
        }

        List<Planning> plannings = new ArrayList<>();
        for (Site site : sites) {
            for (int i = 0; i < nbVisites; i++) {
                Planning planning = new Planning();
                planning.setSite(site);
                planning.setContrat(contrat);
                planning.setNumVisite(i + 1);
                planning.setStatut(StatutVisite.EN_ATTENTE);
                planning.setNbRelances(0);
                planning.setDateEnvoi(LocalDateTime.now());

                LocalDate dateBase = dateDebut.plusMonths((long) i * moisInterval);
                LocalDate dateValide = holidayService.findNextValidDate(dateBase);
                planning.setDateProposee(dateValide);

                plannings.add(planning);
            }
        }

        return sauvegarderPlannings(plannings, sites);
    }

    /**
     * Planifier les visites sans contrat
     */
    private int planifierVisitesPourClientSansContrat(Client client, List<Site> sites, int nbVisitesAn) {
        int moisInterval = nbVisitesAn == 4 ? 3 : 6;
        LocalDate dateDebut = LocalDate.now().plusMonths(1);
        dateDebut = holidayService.findNextValidDate(dateDebut);

        List<Planning> plannings = new ArrayList<>();
        for (Site site : sites) {
            for (int i = 0; i < nbVisitesAn; i++) {
                Planning planning = new Planning();
                planning.setSite(site);
                planning.setContrat(null);
                planning.setNumVisite(i + 1);
                planning.setStatut(StatutVisite.EN_ATTENTE);
                planning.setNbRelances(0);
                planning.setDateEnvoi(LocalDateTime.now());

                LocalDate dateBase = dateDebut.plusMonths((long) i * moisInterval);
                LocalDate dateValide = holidayService.findNextValidDate(dateBase);
                planning.setDateProposee(dateValide);

                plannings.add(planning);
            }
        }

        return sauvegarderPlannings(plannings, sites);
    }

    /**
     * Sauvegarder les plannings avec optimisation
     */
    private int sauvegarderPlannings(List<Planning> plannings, List<Site> sites) {
        boolean hasCoordinates = sites.stream().anyMatch(s -> s.getLatitude() != null && s.getLongitude() != null);

        Map<LocalDate, List<Planning>> journeeMap;

        if (hasCoordinates && plannings.size() > 1) {
            log.info("📍 Optimisation des tournées depuis Temara");
            LocalDate startDate = LocalDate.now().plusDays(1);
            journeeMap = tourneeOptimizationService.planifierTournees(plannings, startDate);
        } else {
            log.info("📅 Planification simple (une visite par jour)");
            journeeMap = routeOptimizationService.planifierParJourSimple(plannings);
        }

        int creees = 0;
        for (Map.Entry<LocalDate, List<Planning>> entry : journeeMap.entrySet()) {
            LocalDate date = entry.getKey();
            List<Planning> planningsDuJour = entry.getValue();

            for (Planning planning : planningsDuJour) {
                planning.setDateProposee(date);
                planning.setDateVisite(date);

                Planning saved = planningRepository.save(planning);
                creees++;

                String ville = planning.getSite().getAdresse() != null ?
                        extractVille(planning.getSite().getAdresse()) : "Inconnu";

                log.info("✅ Visite V{} planifiée pour le site {} ({}) le {}",
                        saved.getNumVisite(),
                        planning.getSite().getNom(),
                        ville,
                        date);

                try {
                    envoyerProposition(saved.getId());
                    log.info("📧 Email envoyé pour la visite V{}", saved.getNumVisite());
                } catch (Exception e) {
                    log.error("❌ Erreur lors de l'envoi de l'email: {}", e.getMessage());
                }
            }

            log.info("📅 Journée du {}: {} visite(s)", date, planningsDuJour.size());
        }

        return creees;
    }

    // ============================================================
    // ✅ MÉTHODES PRIVÉES POUR LA PLANIFICATION PROGRESSIVE
    // ============================================================

    private int getProchainNumVisite(Integer clientId, List<Site> sites) {
        int maxNumVisite = 0;

        for (Site site : sites) {
            List<Planning> plannings = planningRepository.findBySiteAndStatut(site, null);
            for (Planning p : plannings) {
                if (p.getNumVisite() != null && p.getNumVisite() > maxNumVisite) {
                    maxNumVisite = p.getNumVisite();
                }
            }
        }

        return maxNumVisite + 1;
    }

    private boolean visiteExiste(Integer clientId, int numVisite) {
        List<Site> sites = siteRepository.findByClientIdAndActifTrue(clientId);
        for (Site site : sites) {
            List<Planning> plannings = planningRepository.findBySiteAndStatut(site, null);
            for (Planning p : plannings) {
                if (p.getNumVisite() != null && p.getNumVisite() == numVisite) {
                    return true;
                }
            }
        }
        return false;
    }

    private LocalDate calculerDateProchaineVisite(Client client, int numVisite) {
        int nbVisitesAn = client.getNbVisitesAn() != null ? client.getNbVisitesAn() : 4;
        int moisInterval = nbVisitesAn == 4 ? 3 : 6;

        LocalDate dateBase = LocalDate.now().plusMonths(1);
        int decalageMois = (numVisite - 1) * moisInterval;
        LocalDate dateProposee = dateBase.plusMonths(decalageMois);

        dateProposee = holidayService.findNextValidDate(dateProposee);

        log.info("📅 Calcul de la date pour V{}: {} (décalage de {} mois)",
                numVisite, dateProposee, decalageMois);

        return dateProposee;
    }

    private String extractVille(String adresse) {
        if (adresse == null || adresse.isEmpty()) {
            return "Inconnu";
        }
        String[] parts = adresse.split(",");
        return parts.length >= 2 ? parts[parts.length - 1].trim() : adresse;
    }

    // ============================================================
    // ✅ CRUD
    // ============================================================

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
        return planningRepository.findAll();
    }

    // ============================================================
    // ✅ RECHERCHES
    // ============================================================

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
    public List<Planning> getPlanningsByTechnicien(Integer technicienId) {
        Utilisateur technicien = utilisateurRepository.findById(technicienId)
                .orElseThrow(() -> new RuntimeException("Technicien non trouvé"));
        return planningRepository.findByTechnicien(technicien);
    }

    @Override
    public List<Planning> getPlanningsByResponsable(Integer responsableId) {
        Utilisateur responsable = utilisateurRepository.findById(responsableId)
                .orElseThrow(() -> new RuntimeException("Responsable non trouvé"));
        return planningRepository.findByResponsable(responsable);
    }

    @Override
    public List<Planning> getVisitesSansPI() {
        return planningRepository.findVisitesWithoutPI();
    }

    @Override
    public List<Planning> getPlanningsSansResponsable() {
        return planningRepository.findByResponsableIsNull();
    }

    // ============================================================
    // ✅ ACTIONS
    // ============================================================

    @Override
    @Transactional
    public void envoyerProposition(Integer planningId) {
        try {
            Planning planning = getPlanningById(planningId);

            String email = planning.getSite().getEmailContact();
            String clientEmail = planning.getSite().getClient().getEmailContact();

            log.info("📧 Préparation de l'email pour la visite V{}", planning.getNumVisite());
            log.info("📧 Email du site: {}", email);
            log.info("📧 Email du client: {}", clientEmail);

            if ((email == null || email.isEmpty()) && (clientEmail == null || clientEmail.isEmpty())) {
                log.warn("⚠️ Aucun email trouvé pour la visite V{}", planning.getNumVisite());
                return;
            }

            planning.setDateEnvoi(LocalDateTime.now());
            planning.setStatut(StatutVisite.EN_ATTENTE);
            planningRepository.save(planning);

            emailService.sendPropositionEmail(planning);
            log.info("✅ Email envoyé pour la visite V{}", planning.getNumVisite());

        } catch (Exception e) {
            log.error("❌ Error sending proposition for planningId: " + planningId, e);
            throw new RuntimeException("Failed to send proposition", e);
        }
    }

    // service/impl/PlanningServiceImpl.java - Modifier cette méthode

    @Override
    @Transactional
    public void traiterReponseClient(Integer planningId, boolean accepte) {
        try {
            Planning planning = getPlanningById(planningId);
            String ancienStatut = planning.getStatut() != null ? planning.getStatut().name() : "NON_DEFINI";
            planning.setDateReponse(LocalDateTime.now());

            if (accepte) {
                // ✅ ACCEPTÉ - Confirmer la visite
                planning.setStatut(StatutVisite.ACCEPTE);
                planning.setDateConfirmee(planning.getDateProposee());
                planning.setDateVisite(planning.getDateProposee());
                emailService.sendConfirmationEmail(planning);
                notificationService.notifierChangementStatut(planningId, ancienStatut, "ACCEPTE");

                log.info("✅ Visite V{} acceptée par le client", planning.getNumVisite());

            } else {
                // ❌ REFUSÉ PAR LE CLIENT - Reprogrammer automatiquement
                // NE PAS ANNULER ! Proposer une nouvelle date
                planning.setStatut(StatutVisite.REFUSE);
                notificationService.notifierChangementStatut(planningId, ancienStatut, "REFUSE");

                // Proposer une nouvelle date (7 jours plus tard)
                LocalDate nouvelleDate = planning.getDateProposee().plusDays(7);

                // Vérifier que la nouvelle date est valide (week-end, jours fériés, août)
                nouvelleDate = holidayService.findNextValidDate(nouvelleDate);

                planning.setDateProposee(nouvelleDate);
                planning.setStatut(StatutVisite.EN_ATTENTE);
                planning.setNbRelances(0);
                planning.setDateEnvoi(LocalDateTime.now());
                planningRepository.save(planning);

                // Envoyer une nouvelle proposition
                envoyerProposition(planningId);

                log.info("🔄 Nouvelle date proposée pour la visite V{}: {}", planning.getNumVisite(), nouvelleDate);
            }
            planningRepository.save(planning);

        } catch (Exception e) {
            log.error("❌ Error processing response for planningId: " + planningId, e);
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
                notificationService.notifierAdmin(
                        String.format("⚠️ Escalade requise pour la visite V%d", planning.getNumVisite()),
                        "ESCALADE"
                );
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
            String ancienStatut = planning.getStatut() != null ? planning.getStatut().name() : "NON_DEFINI";
            planning.setStatut(StatutVisite.REALISE);
            planning.setResultat(resultat);
            planning.setDateRealisation(LocalDateTime.now());
            planningRepository.save(planning);
            notificationService.notifierChangementStatut(planningId, ancienStatut, "REALISE");
            log.info("✅ Visite V{} marquée comme réalisée", planning.getNumVisite());
        } catch (Exception e) {
            log.error("Error marking visit as realized for planningId: " + planningId, e);
            throw new RuntimeException("Failed to mark visit as realized", e);
        }
    }

    @Override
    @Transactional
    public void marquerTerminee(Integer planningId) {
        Planning planning = getPlanningById(planningId);
        String ancienStatut = planning.getStatut() != null ? planning.getStatut().name() : "NON_DEFINI";
        planning.setStatut(StatutVisite.REALISE);
        planning.setDateRealisation(LocalDateTime.now());
        planningRepository.save(planning);
        notificationService.notifierChangementStatut(planningId, ancienStatut, "REALISE");
    }

    @Override
    @Transactional
    public void annulerAssignmentResponsable(Integer planningId) {
        try {
            Planning planning = getPlanningById(planningId);
            planning.setResponsable(null);
            planningRepository.save(planning);
            log.info("👤 Responsable annulé pour la visite V{}", planning.getNumVisite());
        } catch (Exception e) {
            log.error("Erreur lors de l'annulation du responsable", e);
            throw new RuntimeException("Erreur lors de l'annulation du responsable", e);
        }
    }

    @Override
    @Transactional
    public void annulerAssignmentTechnicien(Integer planningId) {
        try {
            Planning planning = getPlanningById(planningId);
            planning.setTechnicien(null);
            planningRepository.save(planning);
            log.info("🔧 Technicien annulé pour la visite V{}", planning.getNumVisite());
        } catch (Exception e) {
            log.error("Erreur lors de l'annulation du technicien", e);
            throw new RuntimeException("Erreur lors de l'annulation du technicien", e);
        }
    }

    // ============================================================
    // ✅ NOTIFICATIONS
    // ============================================================

    @Override
    public void notifierChangementStatut(Integer planningId, String ancienStatut, String nouveauStatut) {
        try {
            Planning planning = getPlanningById(planningId);
            List<Utilisateur> destinataires = new ArrayList<>();
            if (planning.getResponsable() != null) {
                destinataires.add(planning.getResponsable());
            }
            if (planning.getTechnicien() != null) {
                destinataires.add(planning.getTechnicien());
            }
            destinataires.addAll(utilisateurRepository.findByRole(RoleUtilisateur.ADMIN));

            if (!destinataires.isEmpty()) {
                Notification notification = new Notification();
                notification.setTitre("Changement de statut - Visite V" + planning.getNumVisite());
                notification.setMessage(String.format(
                        "La visite V%d du client %s a changé de statut : %s -> %s",
                        planning.getNumVisite(),
                        planning.getSite().getClient().getNom(),
                        ancienStatut,
                        nouveauStatut
                ));
                notification.setType("STATUT_CHANGEMENT");
                notification.setPlanningId(planningId);
                notification.setLien("/plannings");
                notificationService.saveNotification(notification, destinataires);
            }
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de la notification", e);
        }
    }

    // ============================================================
    // ✅ VALIDATION
    // ============================================================

    private void validatePlanning(Planning planning) {
        if (planning.getDateProposee() != null && planning.getDateProposee().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("La date de visite doit être future");
        }
    }

    // ============================================================
    // ✅ CONVERSION DTO
    // ============================================================

    @Override
    public PlanningDTO convertToDTO(Planning planning) {
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

        if (planning.getSite() != null) {
            if (planning.getSite().getClient() != null) {
                dto.setClientId(planning.getSite().getClient().getId());
                dto.setClientNom(planning.getSite().getClient().getNom());
                dto.setClientEmail(planning.getSite().getClient().getEmailContact());
                dto.setClientCode(planning.getSite().getClient().getCode());
            }
            dto.setSiteId(planning.getSite().getId());
            dto.setSiteNom(planning.getSite().getNom());
            dto.setSiteAdresse(planning.getSite().getAdresse());
            dto.setSiteEmailContact(planning.getSite().getEmailContact());
            dto.setSiteTelephone(planning.getSite().getTelephone());
        }

        if (planning.getTechnicien() != null) {
            dto.setTechnicienId(planning.getTechnicien().getId());
            dto.setTechnicienNom(planning.getTechnicien().getNom() + " " + planning.getTechnicien().getPrenom());
        }

        if (planning.getResponsable() != null) {
            dto.setResponsableId(planning.getResponsable().getId());
            dto.setResponsableNom(planning.getResponsable().getNom() + " " + planning.getResponsable().getPrenom());
        }

        if (planning.getContrat() != null) {
            dto.setContratId(planning.getContrat().getId());
            dto.setContratDateDebut(planning.getContrat().getDateDebut());
            dto.setContratDateFin(planning.getContrat().getDateFin());
            dto.setNbVisitesAn(planning.getContrat().getNbVisitesAn());
        }

        dto.setHasPieceIntervention(planning.getPieceIntervention() != null);
        if (planning.getPieceIntervention() != null) {
            dto.setPieceInterventionId(planning.getPieceIntervention().getId());
        }

        return dto;
    }

    // service/impl/PlanningServiceImpl.java - Ajouter cette méthode

    @Override
    @Transactional
    public void annulerVisite(Integer planningId) {
        try {
            Planning planning = getPlanningById(planningId);
            planning.setStatut(StatutVisite.ANNULE);
            planningRepository.save(planning);
            log.info("🗑️ Visite V{} annulée par l'administrateur", planning.getNumVisite());

            // Notification
            notificationService.notifierChangementStatut(planningId, planning.getStatut().name(), "ANNULE");

        } catch (Exception e) {
            log.error("❌ Erreur lors de l'annulation: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de l'annulation", e);
        }
    }

    @Override
    @Transactional
    public int planifierProchaineVisitePourTousLesClients() {
        log.info("📅 Planification de la prochaine visite pour tous les clients");

        List<Client> clients = clientRepository.findByActifTrue();
        int totalCrees = 0;

        for (Client client : clients) {
            try {
                // Vérifier que le client a un nbVisitesAn
                if (client.getNbVisitesAn() == null || client.getNbVisitesAn() <= 0) {
                    log.warn("⚠️ Client {} sans nbVisitesAn, ignoré", client.getNom());
                    continue;
                }

                // Vérifier si le client a encore des visites à planifier
                List<Site> sites = siteRepository.findByClientIdAndActifTrue(client.getId());
                if (!sites.isEmpty()) {
                    int prochainNum = getProchainNumVisite(client.getId(), sites);
                    if (prochainNum <= client.getNbVisitesAn()) {
                        planifierProchaineVisite(client.getId());
                        totalCrees++;
                    } else {
                        log.info("ℹ️ Client {} a déjà toutes ses visites planifiées", client.getNom());
                    }
                }
            } catch (Exception e) {
                log.error("❌ Erreur pour le client {}: {}", client.getNom(), e.getMessage());
            }
        }

        log.info("✅ Planification de la prochaine visite terminée pour {} clients", totalCrees);
        return totalCrees;
    }

    @Override
    public List<PlanningDTO> convertToDTOList(List<Planning> plannings) {
        return plannings.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
}