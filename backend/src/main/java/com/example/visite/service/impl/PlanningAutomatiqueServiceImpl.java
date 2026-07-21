package com.example.visite.service.impl;

import com.example.visite.model.Planning;
import com.example.visite.model.Client;
import com.example.visite.model.Site;
import com.example.visite.model.Utilisateur;
import com.example.visite.model.enums.StatutVisite;
import com.example.visite.repository.ClientRepository;
import com.example.visite.repository.PlanningRepository;
import com.example.visite.repository.SiteRepository;
import com.example.visite.repository.UtilisateurRepository;
import com.example.visite.service.EmailService;
import com.example.visite.service.PlanningAutomatiqueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlanningAutomatiqueServiceImpl implements PlanningAutomatiqueService {

    private final PlanningRepository planningRepository;
    private final ClientRepository clientRepository;
    private final SiteRepository siteRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final EmailService emailService;

    @Value("${planning.max-visites-par-client:20}")
    private int maxVisitesParClient;

    @Value("${planning.email-delai-minutes:5}")
    private int emailDelaiMinutes;

    @Override
    @Transactional
    public List<Planning> planifierVisitesPourClient(Integer clientId) {
        log.info("📅 Planification automatique pour client ID: {}", clientId);
        List<Planning> planningsCrees = new ArrayList<>();

        try {
            Client client = clientRepository.findById(clientId)
                    .orElseThrow(() -> new RuntimeException("Client non trouvé"));

            List<Site> sites = siteRepository.findByClientIdAndActifTrue(clientId);

            if (sites.isEmpty()) {
                log.warn("⚠️ Aucun site actif pour le client {}", client.getNom());
                return planningsCrees;
            }

            int nbVisitesAn = client.getNbVisitesAn() != null ? client.getNbVisitesAn() : 4;
            int intervalleMois = 12 / nbVisitesAn;
            log.info("Client: {} visites/an, intervalle de {} mois", nbVisitesAn, intervalleMois);

            int prochainNumVisite = genererProchainNumVisitePourClient(clientId);
            log.info("📌 Prochain numéro de visite pour {}: V{}", client.getNom(), prochainNumVisite);

            List<Planning> visitesExistantes = planningRepository.findBySiteClientId(clientId);
            int visitesExistantesCount = visitesExistantes.size();
            log.info("📊 {} visites existantes pour ce client", visitesExistantesCount);

            int maxVisites = Math.min(nbVisitesAn * sites.size(), maxVisitesParClient);
            if (visitesExistantesCount >= maxVisites) {
                log.warn("⚠️ Client {} a déjà {} visites sur {} maximum, ignore",
                        client.getNom(), visitesExistantesCount, maxVisites);
                return planningsCrees;
            }

            LocalDate dateDebut = LocalDate.now().plusMonths(1);

            for (Site site : sites) {
                int visiteCount = 0;
                for (int i = 0; i < nbVisitesAn; i++) {
                    LocalDate dateVisite = dateDebut.plusMonths((long) i * intervalleMois);

                    boolean existe = planningRepository.existsBySiteAndDateVisite(site, dateVisite);

                    if (!existe) {
                        Planning planning = new Planning();
                        planning.setSite(site);
                        planning.setDateVisite(dateVisite);
                        planning.setDateProposee(dateVisite);
                        planning.setDateEnvoi(LocalDateTime.now());
                        planning.setStatut(StatutVisite.EN_ATTENTE);
                        planning.setNumVisite(prochainNumVisite + i);
                        planning.setNbRelances(0);

                        Planning savedPlanning = planningRepository.save(planning);
                        planningsCrees.add(savedPlanning);
                        visiteCount++;

                        log.info("✅ Visite V{} planifiée pour site {} le {}",
                                planning.getNumVisite(), site.getNom(), dateVisite);
                    }
                }
                log.info("📊 {} visite(s) créée(s) pour le site {}", visiteCount, site.getNom());
            }

            log.info("📊 Total visites créées pour le client {}: {}", client.getNom(), planningsCrees.size());

            if (!planningsCrees.isEmpty()) {
                try {
                    emailService.sendPropositionEmail(planningsCrees.get(0));
                    log.info("📧 Un seul email envoyé pour {} visite(s)", planningsCrees.size());

                    notifierAdministrateur("📨 Planification effectuée",
                            String.format("Client: %s, %d visite(s) planifiée(s) (V%d à V%d)",
                                    client.getNom(),
                                    planningsCrees.size(),
                                    prochainNumVisite,
                                    prochainNumVisite + planningsCrees.size() - 1));
                } catch (Exception e) {
                    log.error("❌ Erreur lors de l'envoi de l'email récapitulatif: {}", e.getMessage());
                }
            }

            return planningsCrees;

        } catch (Exception e) {
            log.error("❌ Erreur lors de la planification: {}", e.getMessage(), e);
            return planningsCrees;
        }
    }

    @Override
    @Transactional
    public int planifierVisitesPourTousLesClients() {
        log.info("📅 Génération des visites pour tous les clients");

        List<Client> clients = clientRepository.findByActifTrue();
        log.info("{} clients actifs trouvés", clients.size());

        int totalCrees = 0;
        for (Client client : clients) {
            try {
                List<Planning> plannings = planifierVisitesPourClient(client.getId());
                totalCrees += plannings.size();
            } catch (Exception e) {
                log.error("❌ Erreur pour le client {}: {}", client.getNom(), e.getMessage());
            }
        }

        log.info("📊 Total clients traités: {}, Total visites créées: {}", clients.size(), totalCrees);

        if (totalCrees > 0) {
            notifierAdministrateur("✅ Planification de masse terminée",
                    String.format("%d visites créées pour %d clients", totalCrees, clients.size()));
        }

        return totalCrees;
    }

    @Override
    @Transactional
    public boolean traiterReponseClient(Integer planningId, boolean accepte) {
        log.info("📝 Traitement de la réponse pour la visite ID: {}, Accepté: {}", planningId, accepte);

        try {
            Planning planning = planningRepository.findById(planningId)
                    .orElseThrow(() -> new RuntimeException("Planning non trouvé"));

            String clientNom = planning.getSite().getClient().getNom();
            String siteNom = planning.getSite().getNom();
            Integer numVisite = planning.getNumVisite();

            if (planning.getStatut() == StatutVisite.ACCEPTE ||
                    planning.getStatut() == StatutVisite.REFUSE ||
                    planning.getStatut() == StatutVisite.REALISE) {
                log.warn("⚠️ La visite V{} a déjà été traitée. Statut actuel: {}",
                        numVisite, planning.getStatut());
                return false;
            }

            if (accepte) {
                planning.setStatut(StatutVisite.ACCEPTE);
                planning.setDateConfirmee(LocalDate.now());
                planning.setDateReponse(LocalDateTime.now());
                planning.setDateVisite(planning.getDateProposee());
                planningRepository.save(planning);

                log.info("✅ Visite V{} ACCEPTÉE par {}", numVisite, clientNom);

                try {
                    emailService.sendConfirmationEmail(planning);
                    log.info("📧 Email de confirmation envoyé à {}", clientNom);
                } catch (Exception e) {
                    log.error("❌ Erreur lors de l'envoi de l'email de confirmation: {}", e.getMessage());
                }

                notifierAdministrateur("✅ Visite ACCEPTÉE",
                        String.format("Client: %s, Site: %s, Visite V%d, Date: %s",
                                clientNom, siteNom, numVisite, planning.getDateProposee()));

                try {
                    assignerTechnicienEtResponsable(planning);
                    log.info("🔧 Technicien et responsable assignés automatiquement pour la visite V{}", numVisite);
                } catch (Exception e) {
                    log.warn("⚠️ Erreur lors de l'assignation automatique pour la visite V{}", numVisite);
                }

                return true;

            } else {
                planning.setStatut(StatutVisite.REFUSE);
                planning.setDateReponse(LocalDateTime.now());
                planningRepository.save(planning);

                log.info("❌ Visite V{} REFUSÉE par {}", numVisite, clientNom);

                notifierAdministrateur("❌ Visite REFUSÉE",
                        String.format("Client: %s, Site: %s, Visite V%d, Date proposée: %s",
                                clientNom, siteNom, numVisite, planning.getDateProposee()));

                try {
                    proposerNouvelleDate(planning);
                    log.info("📅 Nouvelle date proposée pour la visite V{}", numVisite);
                } catch (Exception e) {
                    log.error("❌ Erreur lors de la proposition d'une nouvelle date: {}", e.getMessage());
                }

                return true;
            }

        } catch (Exception e) {
            log.error("❌ Erreur lors du traitement de la réponse: {}", e.getMessage(), e);
            return false;
        }
    }

    private void proposerNouvelleDate(Planning planning) {
        log.info("📅 Proposition d'une nouvelle date pour la visite V{}", planning.getNumVisite());

        LocalDate nouvelleDate = planning.getDateProposee().plusMonths(1);
        planning.setDateProposee(nouvelleDate);
        planning.setDateVisite(nouvelleDate);
        planning.setStatut(StatutVisite.EN_ATTENTE);
        planning.setNbRelances(0);
        planning.setDateEnvoi(LocalDateTime.now());

        planningRepository.save(planning);

        try {
            emailService.sendPropositionEmail(planning);
            log.info("📧 Nouvelle proposition envoyée pour la date: {}", nouvelleDate);

            notifierAdministrateur("🔄 Nouvelle date proposée",
                    String.format("Client: %s, Site: %s, Visite V%d, Nouvelle date: %s",
                            planning.getSite().getClient().getNom(),
                            planning.getSite().getNom(),
                            planning.getNumVisite(),
                            nouvelleDate));
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'envoi de la nouvelle proposition: {}", e.getMessage());
        }
    }

    // ✅ MÉTHODE UNIFIÉE POUR ASSIGNER TECHNICIEN ET RESPONSABLE
    private void assignerTechnicienEtResponsable(Planning planning) {
        // Récupérer les techniciens disponibles
        List<Utilisateur> techniciens = utilisateurRepository.findTechniciensActifs();
        List<Utilisateur> responsables = utilisateurRepository.findResponsablesActifs();

        // Assigner un technicien
        if (!techniciens.isEmpty()) {
            Utilisateur technicienChoisi = techniciens.get(0);
            int minVisites = Integer.MAX_VALUE;
            for (Utilisateur technicien : techniciens) {
                int nbVisites = (int) planningRepository.countByTechnicien(technicien);
                if (nbVisites < minVisites) {
                    minVisites = nbVisites;
                    technicienChoisi = technicien;
                }
            }
            planning.setTechnicien(technicienChoisi);
            log.info("🔧 Technicien {} {} assigné", technicienChoisi.getPrenom(), technicienChoisi.getNom());
        }

        // Assigner un responsable
        if (!responsables.isEmpty()) {
            Utilisateur responsableChoisi = responsables.get(0);
            int minVisites = Integer.MAX_VALUE;
            for (Utilisateur responsable : responsables) {
                int nbVisites = (int) planningRepository.countByResponsable(responsable);
                if (nbVisites < minVisites) {
                    minVisites = nbVisites;
                    responsableChoisi = responsable;
                }
            }
            planning.setResponsable(responsableChoisi);
            log.info("👤 Responsable {} {} assigné", responsableChoisi.getPrenom(), responsableChoisi.getNom());
        }

        planningRepository.save(planning);
    }

    private void notifierAdministrateur(String titre, String message) {
        try {
            List<Utilisateur> admins = utilisateurRepository.findAdminsActifs();

            if (admins.isEmpty()) {
                log.warn("⚠️ Aucun administrateur trouvé pour la notification");
                return;
            }

            log.info("🔔 [NOTIFICATION] {}: {}", titre, message);

            for (Utilisateur admin : admins) {
                log.info("📧 Notification à l'administrateur {}: {} - {}", admin.getEmail(), titre, message);
            }

        } catch (Exception e) {
            log.error("❌ Erreur lors de la notification: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public int genererVisitesPourAnnee(int annee) {
        log.info("📅 Génération des visites pour l'année {}", annee);
        return planifierVisitesPourTousLesClients();
    }

    @Override
    public List<Planning> findPlanningsEnAttente() {
        return planningRepository.findByStatut(StatutVisite.EN_ATTENTE);
    }

    @Override
    @Transactional
    public int envoyerRelances() {
        log.info("📧 Envoi des relances pour les visites en attente");

        List<Planning> enAttente = planningRepository.findByStatut(StatutVisite.EN_ATTENTE);
        int relancesEnvoyees = 0;

        for (Planning planning : enAttente) {
            if (planning.getNbRelances() < 3) {
                LocalDateTime dateEnvoi = planning.getDateEnvoi();
                if (dateEnvoi != null) {
                    long joursDepuis = ChronoUnit.DAYS.between(dateEnvoi.toLocalDate(), LocalDate.now());

                    if (joursDepuis >= 7) {
                        try {
                            emailService.sendRelanceEmail(planning);
                            planning.setNbRelances(planning.getNbRelances() + 1);
                            planning.setDateRelance(LocalDateTime.now());
                            planningRepository.save(planning);
                            relancesEnvoyees++;
                            log.info("📧 Relance {} envoyée pour la visite V{}",
                                    planning.getNbRelances(), planning.getNumVisite());

                            notifierAdministrateur("📧 Relance envoyée",
                                    String.format("Client: %s, Visite V%d, Relance n°%d",
                                            planning.getSite().getClient().getNom(),
                                            planning.getNumVisite(),
                                            planning.getNbRelances()));
                        } catch (Exception e) {
                            log.error("❌ Erreur lors de l'envoi de la relance: {}", e.getMessage());
                        }
                    }
                }
            } else {
                planning.setStatut(StatutVisite.ANNULE);
                planningRepository.save(planning);
                try {
                    emailService.sendEscaladeNotification(planning);
                    log.warn("⚠️ Escalade pour la visite V{}", planning.getNumVisite());

                    notifierAdministrateur("🚨 ESCALADE REQUISE",
                            String.format("Client: %s, Visite V%d, 3 relances sans réponse",
                                    planning.getSite().getClient().getNom(),
                                    planning.getNumVisite()));
                } catch (Exception e) {
                    log.error("❌ Erreur lors de l'escalade: {}", e.getMessage());
                }
            }
        }

        log.info("📧 {} relance(s) envoyée(s)", relancesEnvoyees);
        return relancesEnvoyees;
    }

    @Override
    @Transactional
    public void verifierEtMettreAJourStatuts() {
        log.info("🔄 Vérification et mise à jour des statuts des visites");

        List<Planning> plannings = planningRepository.findAll();
        int misAJour = 0;

        for (Planning planning : plannings) {
            boolean modifie = false;

            if (planning.getDateVisite() != null && planning.getDateVisite().isBefore(LocalDate.now())) {
                if (planning.getStatut() == StatutVisite.EN_ATTENTE ||
                        planning.getStatut() == StatutVisite.RELANCE) {
                    planning.setStatut(StatutVisite.ANNULE);
                    modifie = true;
                    log.info("⏰ Visite V{} annulée (date dépassée)", planning.getNumVisite());

                    notifierAdministrateur("⏰ Visite annulée",
                            String.format("Visite V%d annulée car date dépassée", planning.getNumVisite()));
                }

                if (planning.getStatut() == StatutVisite.ACCEPTE) {
                    planning.setStatut(StatutVisite.REALISE);
                    planning.setDateRealisation(LocalDateTime.now());
                    modifie = true;
                    log.info("✅ Visite V{} marquée comme réalisée", planning.getNumVisite());
                }
            }

            if (modifie) {
                planningRepository.save(planning);
                misAJour++;
            }
        }

        if (misAJour > 0) {
            log.info("🔄 {} visite(s) mises à jour", misAJour);
        }
    }

    // ✅ MÉTHODE assignerTechnicienAutomatiquement - CORRIGÉE (un seul)
    @Override
    @Transactional
    public Planning assignerTechnicienAutomatiquement(Integer planningId) {
        log.info("🔧 Assignation automatique d'un technicien pour la visite ID: {}", planningId);

        Planning planning = planningRepository.findById(planningId)
                .orElseThrow(() -> new RuntimeException("Planning non trouvé"));

        assignerTechnicienEtResponsable(planning);
        return planningRepository.save(planning);
    }

    // ✅ UNE SEULE méthode envoyerProposition (pas de doublon)
    @Override
    @Transactional
    public void envoyerProposition(Integer planningId) {
        log.info("📧 Envoi de la proposition pour la visite ID: {}", planningId);

        Planning planning = planningRepository.findById(planningId)
                .orElseThrow(() -> new RuntimeException("Planning non trouvé"));

        try {
            emailService.sendPropositionEmail(planning);
            planning.setDateEnvoi(LocalDateTime.now());
            planning.setStatut(StatutVisite.EN_ATTENTE);
            planningRepository.save(planning);
            log.info("📧 Proposition envoyée avec succès pour la visite V{}", planning.getNumVisite());
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'envoi de la proposition: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public void verifierRelances() {
        log.info("📧 Vérification des relances à envoyer");
        envoyerRelances();
    }

    // ============================================================
    // ✅ MÉTHODES PRIVÉES POUR LA GESTION DES NUMÉROS DE VISITE
    // ============================================================

    private Integer genererProchainNumVisitePourClient(Integer clientId) {
        List<Planning> visitesClient = planningRepository.findBySiteClientId(clientId);

        if (visitesClient.isEmpty()) {
            return 1;
        }

        int maxNum = 0;
        for (Planning p : visitesClient) {
            try {
                Integer numVisite = p.getNumVisite();
                if (numVisite != null && numVisite > maxNum) {
                    maxNum = numVisite;
                }
            } catch (Exception ignored) {}
        }
        return maxNum + 1;
    }

    private Integer genererNumVisite() {
        List<Planning> allPlannings = planningRepository.findAll();
        if (allPlannings.isEmpty()) {
            return 1;
        }
        int maxNum = 0;
        for (Planning p : allPlannings) {
            try {
                Integer numVisite = p.getNumVisite();
                if (numVisite != null && numVisite > maxNum) {
                    maxNum = numVisite;
                }
            } catch (Exception ignored) {}
        }
        return maxNum + 1;
    }
}