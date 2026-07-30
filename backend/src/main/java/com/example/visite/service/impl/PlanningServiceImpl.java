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
import java.util.*;
import java.util.Comparator;
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
    private final HolidayService holidayService;

    @Value("${planning.nb-relances-max:2}")
    private int nbRelancesMax;

    @Value("${planning.rayon-regroupement-km:50}")
    private double rayonRegroupementKm;

    // ============================================================
    // ✅ PLANIFICATION POUR UN CLIENT SPÉCIFIQUE
    // ============================================================

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

            int nbVisitesAn = client.getNbVisitesAn() != null ? client.getNbVisitesAn() : 4;
            int anneeActuelle = LocalDate.now().getYear();

            // ✅ Set global partagé entre TOUS les sites du client
            Set<LocalDate> datesUtilisees = new HashSet<>();

            log.info("📌 Client: {} - {} site(s)", client.getNom(), sites.size());

            // ✅ Pour CHAQUE site, planifier la prochaine visite manquante
            for (Site site : sites) {
                log.info("   📍 Site: {} - ID: {}", site.getNom(), site.getId());

                // ✅ Récupérer les visites existantes pour CE site
                Set<Integer> numerosExistants = getNumerosExistantsPourSite(site, anneeActuelle);
                log.info("      📌 Visites existantes en {}: {}", anneeActuelle, numerosExistants);

                // ✅ Trouver le premier numéro manquant pour CE site
                int prochainNum = trouverProchainNumManquant(numerosExistants, nbVisitesAn);

                if (prochainNum != -1) {
                    // ✅ Planifier avec le Set partagé (évite les doublons de dates)
                    LocalDate dateVisite = planifierVisiteAvecPeriode(site, prochainNum, anneeActuelle, datesUtilisees);
                    if (dateVisite != null) {
                        log.info("      ✅ V{} planifiée pour {} le {}", prochainNum, site.getNom(), dateVisite);
                    }
                } else {
                    // ✅ Si tous les numéros sont pris, passer à l'année suivante
                    log.info("      📌 Toutes les visites planifiées pour {} en {}, passage à {}",
                            site.getNom(), anneeActuelle, anneeActuelle + 1);
                    planifierProchaineVisitePourSiteAnnee(site, anneeActuelle + 1, datesUtilisees);
                }
            }

            log.info("✅ Planification terminée pour le client {}", client.getNom());

        } catch (Exception e) {
            log.error("❌ Erreur lors de la planification: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la planification: " + e.getMessage());
        }
    }

    // ============================================================
    // ✅ PLANIFICATION POUR TOUS LES CLIENTS
    // ============================================================

    // service/impl/PlanningServiceImpl.java - REMPLACER COMPLÈTEMENT cette méthode

    @Override
    @Transactional
    public int planifierProchaineVisitePourTousLesClients() {
        log.info("📅 Planification UNIQUEMENT de la prochaine visite manquante (synchronisée)");

        List<Client> clients = clientRepository.findByActifTrue();
        int totalCrees = 0;

        // ✅ Définir l'ordre des zones
        List<String> ordreZones = Arrays.asList("Centre", "Nord", "Sud", "Autre");

        // ✅ Définition des villes par zone
        List<String> zoneNord = Arrays.asList(
                "tanger", "tetouan", "chefchaouen", "larache", "asilah",
                "fnideq", "martil", "m'diq", "al hoceima", "nador",
                "oujda", "berkane", "taourirt", "jerada", "saidia", "driouch",
                "taza", "taounate", "guercif"
        );

        List<String> zoneCentre = Arrays.asList(
                "casablanca", "rabat", "salé", "temara", "kenitra", "mohammedia",
                "benslimane", "bouznika", "berrechid", "settat", "el jadida",
                "azemmour", "khouribga", "oued zem", "sidi slimane", "sidi kacem",
                "meknes", "fes", "khemisset", "sefrou", "moulay yaacoub"
        );

        List<String> zoneSud = Arrays.asList(
                "agadir", "marrakech", "essaouira", "safi", "chichaoua",
                "el kelaa des sraghna", "youssoufia", "rehamna", "taroudannt",
                "tiznit", "ochtane", "biougra", "taliouine", "ouarzazate",
                "tinghir", "zagora", "rissani", "erfoud", "midelt",
                "guelmim", "tan-tan", "taghjijt", "bouizakarne", "sidi ifni",
                "laayoune", "boujdour", "tarfaya", "es-semara", "dakhla",
                "azilal", "khenifra", "fquih ben salah", "beni mellal"
        );

        int anneeActuelle = LocalDate.now().getYear();
        int moisActuel = LocalDate.now().getMonthValue();

        // ✅ Trouver la prochaine PÉRIODE GLOBALE à planifier
        int prochainePeriodeGlobale = trouverProchainePeriodeGlobale(clients, anneeActuelle, moisActuel);

        if (prochainePeriodeGlobale == -1) {
            log.info("ℹ️ Toutes les visites sont planifiées pour tous les clients");
            return 0;
        }

        log.info("📌 Prochaine période globale à planifier: Période {}", prochainePeriodeGlobale);

        // ✅ Récupérer TOUS les sites de TOUS les clients
        List<Site> tousLesSites = new ArrayList<>();
        Map<Integer, Client> clientParSite = new HashMap<>();

        for (Client client : clients) {
            if (client.getNbVisitesAn() == null || client.getNbVisitesAn() <= 0) continue;
            List<Site> sites = siteRepository.findByClientIdAndActifTrue(client.getId());
            for (Site site : sites) {
                tousLesSites.add(site);
                clientParSite.put(site.getId(), client);
                if (site.getLatitude() == null || site.getLongitude() == null) {
                    geocodingService.geocodeSite(site);
                    siteRepository.save(site);
                }
            }
        }

        // ✅ Trier par ZONE puis par distance
        Site temara = new Site();
        temara.setLatitude(33.9286);
        temara.setLongitude(-6.9020);

        tousLesSites.sort((s1, s2) -> {
            String ville1 = extractVille(s1.getAdresse()).toLowerCase().trim();
            String ville2 = extractVille(s2.getAdresse()).toLowerCase().trim();

            String zone1 = "Autre";
            String zone2 = "Autre";

            if (zoneCentre.contains(ville1)) zone1 = "Centre";
            else if (zoneNord.contains(ville1)) zone1 = "Nord";
            else if (zoneSud.contains(ville1)) zone1 = "Sud";

            if (zoneCentre.contains(ville2)) zone2 = "Centre";
            else if (zoneNord.contains(ville2)) zone2 = "Nord";
            else if (zoneSud.contains(ville2)) zone2 = "Sud";

            int index1 = ordreZones.indexOf(zone1);
            int index2 = ordreZones.indexOf(zone2);

            if (index1 != index2) {
                return Integer.compare(index1, index2);
            }

            double d1 = geocodingService.calculateDistance(temara, s1);
            double d2 = geocodingService.calculateDistance(temara, s2);
            return Double.compare(d1, d2);
        });

        log.info("📍 Ordre global des sites: {}",
                tousLesSites.stream()
                        .map(s -> extractVille(s.getAdresse()))
                        .collect(Collectors.toList()));

        // ✅ Date courante partagée (avance uniquement quand une visite est planifiée)
        LocalDate currentDate = LocalDate.now().plusDays(1);
        Set<LocalDate> datesUtilisees = new HashSet<>();

        // ✅ Pour chaque site (dans l'ordre géographique)
        for (Site site : tousLesSites) {
            Client client = clientParSite.get(site.getId());
            if (client == null) continue;

            int nbVisitesAn = client.getNbVisitesAn() != null ? client.getNbVisitesAn() : 4;

            // ✅ Déterminer le numéro de visite à planifier
            int numVisiteAPlanifier = getNumeroVisitePourPeriode(prochainePeriodeGlobale, nbVisitesAn);
            if (numVisiteAPlanifier == -1) {
                // Ce site n'a pas de visite pour cette période (ex: 2 visites/an pour période 2 ou 4)
                log.debug("   ⏭️ Site: {} - Période {} non applicable ({} visites/an)",
                        site.getNom(), prochainePeriodeGlobale, nbVisitesAn);
                continue;
            }

            // ✅ Déterminer l'année cible
            int anneeCible = anneeActuelle;
            if (prochainePeriodeGlobale >= 5 && prochainePeriodeGlobale <= 8) {
                anneeCible = anneeActuelle + 1;
            }

            // ✅ Vérifier si cette visite existe déjà
            List<Planning> planningsExistants = planningRepository.findBySite(site);
            boolean existeDeja = false;
            for (Planning p : planningsExistants) {
                if (p.getNumVisite() != null && p.getNumVisite() == numVisiteAPlanifier
                        && p.getStatut() != StatutVisite.ANNULE) {
                    if (p.getDateProposee() != null && p.getDateProposee().getYear() == anneeCible) {
                        existeDeja = true;
                        break;
                    }
                }
            }
            if (existeDeja) {
                log.info("   ⏭️ Site: {} - V{} déjà planifiée en {}", site.getNom(), numVisiteAPlanifier, anneeCible);
                continue;
            }

            // ✅ Récupérer la période pour ce numéro de visite et ce client
            HolidayService.Period period = holidayService.getPeriodForVisite(numVisiteAPlanifier, nbVisitesAn);
            LocalDate dateDebutPeriode = LocalDate.of(anneeCible, period.moisDebut, 1);
            LocalDate dateFinPeriode = LocalDate.of(anneeCible, period.moisFin, 1)
                    .with(java.time.temporal.TemporalAdjusters.lastDayOfMonth());

            // ✅ Chercher la première date disponible dans la période
            // On commence par la date idéale (début de période) mais on doit être >= currentDate
            LocalDate startSearch = dateDebutPeriode.isAfter(currentDate) ? dateDebutPeriode : currentDate;

            LocalDate dateFinale = null;
            for (LocalDate d = startSearch; !d.isAfter(dateFinPeriode); d = d.plusDays(1)) {
                if (holidayService.isValidDateForVisit(d) && !datesUtilisees.contains(d)) {
                    dateFinale = d;
                    break;
                }
            }

            if (dateFinale == null) {
                log.warn("   ⚠️ Site: {} - Aucune date disponible dans la période {}-{} pour V{}",
                        site.getNom(), dateDebutPeriode, dateFinPeriode, numVisiteAPlanifier);
                continue;
            }

            // ✅ Marquer la date comme utilisée et avancer la date courante
            datesUtilisees.add(dateFinale);
            currentDate = dateFinale.plusDays(1);

            // ✅ Créer la visite
            Planning planning = new Planning();
            planning.setSite(site);
            planning.setNumVisite(numVisiteAPlanifier);
            planning.setStatut(StatutVisite.EN_ATTENTE);
            planning.setNbRelances(0);
            planning.setDateEnvoi(LocalDateTime.now());
            planning.setDateProposee(dateFinale);
            planning.setDateVisite(dateFinale);

            Planning saved = planningRepository.save(planning);
            totalCrees++;

            String numAffiche = getNumeroVisiteAffiche(numVisiteAPlanifier, nbVisitesAn);
            double distance = geocodingService.calculateDistance(temara, site);
            String ville = extractVille(site.getAdresse());
            String zone = "Autre";
            if (zoneCentre.contains(ville.toLowerCase())) zone = "Centre";
            else if (zoneNord.contains(ville.toLowerCase())) zone = "Nord";
            else if (zoneSud.contains(ville.toLowerCase())) zone = "Sud";

            log.info("   ✅ {} - {} ({}) - Zone: {} - Distance: {:.1f} km - Date: {}",
                    numAffiche, site.getNom(), ville, zone, distance, dateFinale);
        }

        log.info("✅ Planification terminée: {} visites créées", totalCrees);
        return totalCrees;
    }

    /**
     * ✅ Trouver la prochaine période globale à planifier
     */
    private int trouverProchainePeriodeGlobale(List<Client> clients, int anneeActuelle, int moisActuel) {
        // ✅ Périodes globales (4 visites/an)
        // 1 = V1, 2 = V2, 3 = V3, 4 = V4 pour l'année en cours
        // 5 = V1 année suivante, 6 = V2 année suivante, 7 = V3 année suivante, 8 = V4 année suivante

        // ✅ Déterminer la période en cours
        int periodeEnCours = 1;
        if (moisActuel >= 1 && moisActuel <= 3) periodeEnCours = 1;
        else if (moisActuel >= 4 && moisActuel <= 6) periodeEnCours = 2;
        else if (moisActuel >= 7 && moisActuel <= 9) periodeEnCours = 3;
        else if (moisActuel >= 10 && moisActuel <= 12) periodeEnCours = 4;

        log.info("📌 Période en cours: P{}", periodeEnCours);

        // ✅ Vérifier si toutes les visites de l'année en cours sont planifiées
        // Pour chaque période de 1 à 4, vérifier si tous les clients ont cette visite planifiée
        for (int periode = periodeEnCours; periode <= 4; periode++) {
            boolean toutesPlanifiees = true;
            for (Client client : clients) {
                if (client.getNbVisitesAn() == null || client.getNbVisitesAn() <= 0) continue;
                List<Site> sites = siteRepository.findByClientIdAndActifTrue(client.getId());
                for (Site site : sites) {
                    // ✅ Déterminer le numéro de visite correspondant
                    int numVisite = periode;
                    if (client.getNbVisitesAn() == 2) {
                        // ✅ Pour 2 visites/an : V1 ↔ période 1, V2 ↔ période 3
                        if (periode == 1) numVisite = 1;
                        else if (periode == 3) numVisite = 2;
                        else continue; // Les périodes 2 et 4 n'existent pas pour 2 visites/an
                    }

                    List<Planning> plannings = planningRepository.findBySite(site);
                    boolean existe = false;
                    for (Planning p : plannings) {
                        if (p.getNumVisite() != null && p.getNumVisite() == numVisite
                                && p.getStatut() != StatutVisite.ANNULE) {
                            if (p.getDateProposee() != null && p.getDateProposee().getYear() == anneeActuelle) {
                                existe = true;
                                break;
                            }
                        }
                    }
                    if (!existe) {
                        toutesPlanifiees = false;
                        break;
                    }
                }
                if (!toutesPlanifiees) break;
            }
            if (!toutesPlanifiees) {
                return periode;
            }
        }

        // ✅ Si toutes les périodes de l'année en cours sont planifiées, passer à l'année suivante
        for (int periode = 1; periode <= 4; periode++) {
            boolean toutesPlanifiees = true;
            for (Client client : clients) {
                if (client.getNbVisitesAn() == null || client.getNbVisitesAn() <= 0) continue;
                List<Site> sites = siteRepository.findByClientIdAndActifTrue(client.getId());
                for (Site site : sites) {
                    int numVisite = periode;
                    if (client.getNbVisitesAn() == 2) {
                        if (periode == 1) numVisite = 1;
                        else if (periode == 3) numVisite = 2;
                        else continue;
                    }

                    List<Planning> plannings = planningRepository.findBySite(site);
                    boolean existe = false;
                    for (Planning p : plannings) {
                        if (p.getNumVisite() != null && p.getNumVisite() == numVisite
                                && p.getStatut() != StatutVisite.ANNULE) {
                            if (p.getDateProposee() != null && p.getDateProposee().getYear() == anneeActuelle + 1) {
                                existe = true;
                                break;
                            }
                        }
                    }
                    if (!existe) {
                        toutesPlanifiees = false;
                        break;
                    }
                }
                if (!toutesPlanifiees) break;
            }
            if (!toutesPlanifiees) {
                return periode + 4; // 5 = V1 an+1, 6 = V2 an+1, 7 = V3 an+1, 8 = V4 an+1
            }
        }

        return -1;
    }

    /**
     * ✅ Obtenir le numéro de visite pour une période donnée
     */
    private int getNumeroVisitePourPeriode(int periode, int nbVisitesAn) {
        if (nbVisitesAn == 4) {
            return periode % 4 == 0 ? 4 : periode % 4;
        } else if (nbVisitesAn == 2) {
            if (periode == 1 || periode == 5) return 1;
            if (periode == 3 || periode == 7) return 2;
            return -1;
        }
        return -1;
    }

    /**
     * ✅ Obtenir le numéro de visite pour l'affichage
     */
    private String getNumeroVisiteAffiche(int numVisite, int nbVisitesAn) {
        if (nbVisitesAn == 2) {
            if (numVisite == 1) return "V1";
            if (numVisite == 2) return "V2";
        }
        return "V" + numVisite;
    }

    /**
     * ✅ Trouver la prochaine visite à planifier en respectant les périodes
     * Retourne [numVisite, annee]
     */
    private int[] trouverProchaineVisiteAvecPeriode(List<Planning> planningsExistants, int nbVisitesAn, int moisActuel, int anneeActuelle) {
        // ✅ 1. Récupérer tous les numéros existants par année
        Set<Integer> numeros2026 = new HashSet<>();
        Set<Integer> numeros2027 = new HashSet<>();

        for (Planning p : planningsExistants) {
            if (p.getNumVisite() == null || p.getStatut() == StatutVisite.ANNULE) continue;
            if (p.getDateProposee() == null) continue;

            int annee = p.getDateProposee().getYear();
            if (annee == 2026) {
                numeros2026.add(p.getNumVisite());
            } else if (annee == 2027) {
                numeros2027.add(p.getNumVisite());
            }
        }

        // ✅ 2. Déterminer la période en cours
        int periodeEnCours = 1;
        if (moisActuel >= 1 && moisActuel <= 3) periodeEnCours = 1;  // V1
        else if (moisActuel >= 4 && moisActuel <= 6) periodeEnCours = 2;  // V2
        else if (moisActuel >= 7 && moisActuel <= 9) periodeEnCours = 3;  // V3
        else if (moisActuel >= 10 && moisActuel <= 12) periodeEnCours = 4;  // V4

        log.debug("   📌 Période en cours: V{}", periodeEnCours);

        // ✅ 3. Vérifier si la période en cours est déjà planifiée pour 2026
        boolean periodeEnCoursPlanifiee = numeros2026.contains(periodeEnCours);

        // ✅ 4. Si la période en cours n'est pas planifiée, la planifier
        if (!periodeEnCoursPlanifiee) {
            return new int[]{periodeEnCours, anneeActuelle};
        }

        // ✅ 5. Si la période en cours est planifiée, chercher la prochaine période
        // ✅ 5a. D'abord, vérifier les périodes suivantes dans la même année
        for (int i = periodeEnCours + 1; i <= nbVisitesAn; i++) {
            if (!numeros2026.contains(i)) {
                return new int[]{i, anneeActuelle};
            }
        }

        // ✅ 5b. Si toutes les périodes de 2026 sont planifiées, passer à 2027
        for (int i = 1; i <= nbVisitesAn; i++) {
            if (!numeros2027.contains(i)) {
                return new int[]{i, anneeActuelle + 1};
            }
        }

        // ✅ 5c. Si toutes les visites sont planifiées
        return new int[]{-1, anneeActuelle};
    }






    /**
     * ✅ Créer et sauvegarder une visite pour un site
     */
    private void creerEtSauvegarderVisite(Site site, int numVisite, LocalDate dateVisite) {
        Planning planning = new Planning();
        planning.setSite(site);
        planning.setNumVisite(numVisite);
        planning.setStatut(StatutVisite.EN_ATTENTE);
        planning.setNbRelances(0);
        planning.setDateEnvoi(LocalDateTime.now());
        planning.setDateProposee(dateVisite);
        planning.setDateVisite(dateVisite);

        Planning saved = planningRepository.save(planning);
        log.info("✅ V{} planifiée pour {} le {}", numVisite, site.getNom(), dateVisite);

        try {
            envoyerProposition(saved.getId());
        } catch (Exception e) {
            log.error("❌ Erreur envoi email: {}", e.getMessage());
        }
    }

    /**
     * ✅ Calculer la date pour une année spécifique
     */
    private LocalDate calculerDateParPeriodePourAnnee(Client client, int numVisite, int annee) {
        int nbVisitesAn = client.getNbVisitesAn() != null ? client.getNbVisitesAn() : 4;
        HolidayService.Period period = holidayService.getPeriodForVisite(numVisite, nbVisitesAn);

        LocalDate dateBase = LocalDate.of(annee, period.moisDebut, 1);

        // ✅ Pour V3 (mois 7-9), exclure AOUT
        LocalDate dateValide;
        boolean isV3 = (period.moisDebut == 7 && period.moisFin == 9);
        boolean isV2With2Visits = (nbVisitesAn == 2 && period.moisDebut == 7 && period.moisFin == 12);

        if (isV3 || isV2With2Visits) {
            dateValide = holidayService.findNextValidDateInPeriodExcludingAugust(dateBase, period.moisDebut, period.moisFin);
        } else {
            dateValide = holidayService.findNextValidDateInPeriod(dateBase, period.moisDebut, period.moisFin);
        }

        return dateValide;
    }

    // ============================================================
    // ✅ MÉTHODES PRINCIPALES DE PLANIFICATION
    // ============================================================

    // service/impl/PlanningServiceImpl.java - REMPLACER COMPLÈTEMENT cette méthode

    @Transactional
    private LocalDate planifierVisiteAvecPeriode(Site site, int numVisite, int annee, Set<LocalDate> datesUtilisees) {
        log.info("📅 Planification V{} pour {} en {}", numVisite, site.getNom(), annee);

        try {
            Client client = site.getClient();
            int nbVisitesAn = client.getNbVisitesAn() != null ? client.getNbVisitesAn() : 4;

            HolidayService.Period period = holidayService.getPeriodForVisite(numVisite, nbVisitesAn);
            log.info("   📌 Période V{}: {}-{}", numVisite, period.moisDebut, period.moisFin);

            // ✅ Commencer au début de la période
            LocalDate dateBase = LocalDate.of(annee, period.moisDebut, 1);

            // ✅ Si la date est dans le passé, avancer d'un jour
            LocalDate now = LocalDate.now();
            if (dateBase.isBefore(now) || dateBase.isEqual(now)) {
                dateBase = dateBase.plusDays(1);
                log.info("   📌 Date de base ajustée: {}", dateBase);
            }

            // ✅ Récupérer les dates déjà utilisées par CE site
            Set<LocalDate> datesSite = new HashSet<>();
            List<Planning> planningsSite = planningRepository.findBySite(site);
            for (Planning p : planningsSite) {
                if (p.getDateProposee() != null && p.getStatut() != StatutVisite.ANNULE) {
                    datesSite.add(p.getDateProposee());
                }
            }

            // ✅ LOG DÉTAILLÉ DES DATES DÉJÀ UTILISÉES
            log.info("   📌 Dates déjà utilisées par {}: {}", site.getNom(), datesSite);
            log.info("   📌 Dates globales déjà utilisées: {}", datesUtilisees);

            LocalDate dateValide = null;
            int maxAttempts = 365;

            for (int i = 0; i < maxAttempts; i++) {
                LocalDate candidate = dateBase.plusDays(i);
                int mois = candidate.getMonthValue();

                // ✅ Vérifier que le mois est dans la période
                if (mois < period.moisDebut || mois > period.moisFin) {
                    log.debug("      📌 {}: hors période ({}-{})", candidate, period.moisDebut, period.moisFin);
                    continue;
                }

                // ✅ Vérifier que la date est valide (pas week-end, pas férié, pas août)
                if (!holidayService.isValidDateForVisit(candidate)) {
                    log.debug("      📌 {}: date invalide (week-end, férié ou août)", candidate);
                    continue;
                }

                // ✅ Vérifier que la date n'est pas déjà utilisée (GLOBAL)
                if (datesUtilisees.contains(candidate)) {
                    log.debug("      📌 {}: date déjà utilisée par un autre site", candidate);
                    continue;
                }

                // ✅ Vérifier que ce site n'a pas déjà une visite à cette date
                if (datesSite.contains(candidate)) {
                    log.debug("      📌 {}: ce site a déjà une visite à cette date", candidate);
                    continue;
                }

                // ✅ Date valide trouvée !
                dateValide = candidate;
                log.info("   ✅ Date trouvée pour {}: {}", site.getNom(), dateValide);
                break;
            }

            if (dateValide == null) {
                log.warn("⚠️ Aucune date trouvée pour {} V{} dans la période {}-{}",
                        site.getNom(), numVisite, period.moisDebut, period.moisFin);

                // ✅ Fallback : chercher une date dans l'année suivante
                log.info("   🔄 Recherche dans l'année {}...", annee + 1);
                return planifierVisiteAvecPeriode(site, numVisite, annee + 1, datesUtilisees);
            }

            // ✅ Marquer la date comme utilisée (GLOBAL)
            datesUtilisees.add(dateValide);

            // ✅ Créer la visite
            Planning planning = new Planning();
            planning.setSite(site);
            planning.setContrat(null);
            planning.setNumVisite(numVisite);
            planning.setStatut(StatutVisite.EN_ATTENTE);
            planning.setNbRelances(0);
            planning.setDateEnvoi(LocalDateTime.now());
            planning.setDateProposee(dateValide);
            planning.setDateVisite(dateValide);

            Planning saved = planningRepository.save(planning);

            log.info("✅ V{} planifiée pour {} le {} (période: {}-{})",
                    numVisite, site.getNom(), dateValide, period.moisDebut, period.moisFin);

            try {
                envoyerProposition(saved.getId());
            } catch (Exception e) {
                log.error("❌ Erreur envoi email: {}", e.getMessage());
            }

            return dateValide;

        } catch (Exception e) {
            log.error("❌ Erreur lors de la planification pour {}: {}", site.getNom(), e.getMessage(), e);
            return null;
        }
    }

    @Transactional
    private void planifierProchaineVisitePourSiteAnnee(Site site, int annee, Set<LocalDate> datesUtilisees) {
        log.info("📅 Planification de la prochaine visite pour {} en {}", site.getNom(), annee);

        try {
            Client client = site.getClient();
            int nbVisitesAn = client.getNbVisitesAn() != null ? client.getNbVisitesAn() : 4;

            Set<Integer> numerosExistants = getNumerosExistantsPourSite(site, annee);

            int prochainNum = trouverProchainNumManquant(numerosExistants, nbVisitesAn);

            if (prochainNum == -1) {
                log.info("📌 Toutes les visites planifiées pour {} en {}, passage à {}",
                        site.getNom(), annee, annee + 1);
                planifierProchaineVisitePourSiteAnnee(site, annee + 1, datesUtilisees);
                return;
            }

            LocalDate dateVisite = planifierVisiteAvecPeriode(site, prochainNum, annee, datesUtilisees);
            if (dateVisite != null) {
                log.info("✅ V{} planifiée pour {} le {} (année {})",
                        prochainNum, site.getNom(), dateVisite, annee);
            }

        } catch (Exception e) {
            log.error("❌ Erreur lors de la planification pour {}: {}", site.getNom(), e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la planification: " + e.getMessage());
        }
    }

    // ============================================================
    // ✅ MÉTHODES DE VÉRIFICATION
    // ============================================================

    private Set<Integer> getNumerosExistantsPourSite(Site site, int annee) {
        Set<Integer> numeros = new HashSet<>();

        List<Planning> plannings = planningRepository.findBySite(site);
        for (Planning p : plannings) {
            if (p.getNumVisite() != null && p.getStatut() != StatutVisite.ANNULE) {
                if (p.getDateProposee() != null && p.getDateProposee().getYear() == annee) {
                    numeros.add(p.getNumVisite());
                }
            }
        }

        return numeros;
    }

    private int trouverProchainNumManquant(Set<Integer> numerosExistants, int nbVisitesAn) {
        for (int i = 1; i <= nbVisitesAn; i++) {
            if (!numerosExistants.contains(i)) {
                return i;
            }
        }
        return -1;
    }

    private String extractVille(String adresse) {
        if (adresse == null || adresse.isEmpty()) {
            return "Inconnu";
        }
        String[] parts = adresse.split(",");
        if (parts.length >= 2) {
            String ville = parts[parts.length - 1].trim();
            ville = ville.replaceAll("\\d{5}", "").trim();
            if (!ville.isEmpty()) {
                return ville;
            }
        }
        return adresse.substring(0, Math.min(20, adresse.length()));
    }

    // ============================================================
    // ✅ AUTRES MÉTHODES DE PLANIFICATION
    // ============================================================

    @Override
    @Transactional
    public void planifierVisitesPourClient(Integer clientId) {
        log.info("📅 Planification complète pour le client ID: {}", clientId);

        try {
            Client client = clientRepository.findById(clientId)
                    .orElseThrow(() -> new RuntimeException("Client non trouvé"));

            List<Site> sites = siteRepository.findByClientIdAndActifTrue(clientId);
            if (sites.isEmpty()) {
                throw new RuntimeException("Le client n'a pas de site actif");
            }

            int nbVisitesAn = client.getNbVisitesAn() != null ? client.getNbVisitesAn() : 4;
            int anneeActuelle = LocalDate.now().getYear();

            // ✅ Set global partagé entre TOUS les sites du client
            Set<LocalDate> datesUtilisees = new HashSet<>();

            log.info("📌 Client: {} - {} site(s) - {} visites/an",
                    client.getNom(), sites.size(), nbVisitesAn);

            for (Site site : sites) {
                log.info("   📍 Site: {} - ID: {}", site.getNom(), site.getId());

                for (int numVisite = 1; numVisite <= nbVisitesAn; numVisite++) {
                    // ✅ Planifier avec le Set partagé
                    LocalDate dateVisite = planifierVisiteAvecPeriode(site, numVisite, anneeActuelle, datesUtilisees);
                    if (dateVisite != null) {
                        log.info("      ✅ V{} planifiée pour {} le {}", numVisite, site.getNom(), dateVisite);
                    }
                }
            }

            log.info("✅ Planification complète terminée pour le client {}", client.getNom());

        } catch (Exception e) {
            log.error("❌ Erreur lors de la planification: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la planification: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public int planifierVisitesPourTousLesClients() {
        log.info("📅 Planification complète pour tous les clients");

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

    @Override
    @Transactional
    public void planifierToutesVisitesManquantes(Integer clientId) {
        log.info("📅 Planification de toutes les visites manquantes pour le client ID: {}", clientId);

        try {
            Client client = clientRepository.findById(clientId)
                    .orElseThrow(() -> new RuntimeException("Client non trouvé"));

            int nbVisitesAn = client.getNbVisitesAn() != null ? client.getNbVisitesAn() : 4;
            int anneeActuelle = LocalDate.now().getYear();

            List<Site> sites = siteRepository.findByClientIdAndActifTrue(clientId);
            Set<LocalDate> datesUtilisees = new HashSet<>();

            for (Site site : sites) {
                Set<Integer> numerosExistants = getNumerosExistantsPourSite(site, anneeActuelle);
                for (int i = 1; i <= nbVisitesAn; i++) {
                    if (!numerosExistants.contains(i)) {
                        LocalDate dateVisite = planifierVisiteAvecPeriode(site, i, anneeActuelle, datesUtilisees);
                        if (dateVisite != null) {
                            log.info("✅ V{} planifiée pour {} le {}", i, site.getNom(), dateVisite);
                        }
                    }
                }
            }

        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur: " + e.getMessage());
        }
    }


    // service/impl/PlanningServiceImpl.java - REMPLACER cette partie
// service/impl/PlanningServiceImpl.java - AJOUTER un Set global

    // ✅ Déclarer un Set global pour suivre toutes les dates du client
    private final Map<Integer, Set<LocalDate>> datesUtiliseesParClient = new HashMap<>();

    // service/impl/PlanningServiceImpl.java - REMPLACER COMPLÈTEMENT

    @Override
    @Transactional
    public void planifierVisiteSpecifique(Integer clientId, Integer numVisite) {
        log.info("📅 Planification de la visite V{} pour le client ID: {}", numVisite, clientId);

        try {
            Client client = clientRepository.findById(clientId)
                    .orElseThrow(() -> new RuntimeException("Client non trouvé"));

            int nbVisitesAn = client.getNbVisitesAn() != null ? client.getNbVisitesAn() : 4;
            if (numVisite < 1 || numVisite > nbVisitesAn) {
                throw new RuntimeException("Numéro de visite invalide. Le client a " + nbVisitesAn + " visites par an.");
            }

            List<Site> sites = siteRepository.findByClientIdAndActifTrue(clientId);
            if (sites.isEmpty()) {
                throw new RuntimeException("Le client n'a pas de site actif");
            }

            int annee = LocalDate.now().getYear();

            // ✅ Récupérer TOUTES les dates utilisées par TOUS les sites du client
            Set<LocalDate> datesUtilisees = new HashSet<>();
            for (Site site : sites) {
                List<Planning> plannings = planningRepository.findBySite(site);
                for (Planning p : plannings) {
                    if (p.getDateProposee() != null && p.getStatut() != StatutVisite.ANNULE) {
                        datesUtilisees.add(p.getDateProposee());
                    }
                }
            }
            log.info("📌 Toutes les dates utilisées: {}", datesUtilisees);

            // ✅ Compter les visites V{numVisite} existantes
            int countExisting = 0;
            for (Site site : sites) {
                if (visiteExistePourSite(site, numVisite)) {
                    countExisting++;
                }
            }
            log.info("📌 Visites V{} déjà existantes: {}", numVisite, countExisting);

            // ✅ Trouver la période
            HolidayService.Period period = holidayService.getPeriodForVisite(numVisite, nbVisitesAn);
            log.info("📌 Période V{}: {}-{}", numVisite, period.moisDebut, period.moisFin);

            // ✅ Pour CHAQUE site, planifier une date UNIQUE
            int offset = countExisting;
            for (Site site : sites) {
                boolean visiteExistante = visiteExistePourSite(site, numVisite);

                if (!visiteExistante) {
                    // ✅ Chercher une date avec un offset qui s'incrémente
                    LocalDate dateVisite = trouverDateAvecOffset(
                            site, numVisite, annee, period, datesUtilisees, offset
                    );

                    if (dateVisite != null) {
                        datesUtilisees.add(dateVisite);
                        offset++;

                        Planning planning = new Planning();
                        planning.setSite(site);
                        planning.setContrat(null);
                        planning.setNumVisite(numVisite);
                        planning.setStatut(StatutVisite.EN_ATTENTE);
                        planning.setNbRelances(0);
                        planning.setDateEnvoi(LocalDateTime.now());
                        planning.setDateProposee(dateVisite);
                        planning.setDateVisite(dateVisite);

                        Planning saved = planningRepository.save(planning);
                        log.info("   ✅ V{} planifiée pour {} le {}",
                                numVisite, site.getNom(), dateVisite);

                        try {
                            envoyerProposition(saved.getId());
                        } catch (Exception e) {
                            log.error("❌ Erreur envoi email: {}", e.getMessage());
                        }
                    }
                }
            }

            log.info("✅ Planification V{} terminée", numVisite);

        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur: " + e.getMessage());
        }
    }

    /**
     * ✅ Trouver une date avec un OFFSET qui s'incrémente
     */
    private LocalDate trouverDateAvecOffset(Site site, int numVisite, int annee,
                                            HolidayService.Period period, Set<LocalDate> datesUtilisees, int offset) {

        log.info("🔍 Recherche V{} - {} (offset: {})", numVisite, site.getNom(), offset);

        // ✅ Récupérer les dates du site
        Set<LocalDate> datesSite = new HashSet<>();
        List<Planning> planningsSite = planningRepository.findBySite(site);
        for (Planning p : planningsSite) {
            if (p.getDateProposee() != null && p.getStatut() != StatutVisite.ANNULE) {
                datesSite.add(p.getDateProposee());
            }
        }

        log.info("   📌 Dates du site {}: {}", site.getNom(), datesSite);
        log.info("   📌 Dates globales: {}", datesUtilisees);
        log.info("   📌 Offset: {}", offset);

        // ✅ Date de départ = début de la période + offset
        LocalDate dateCourante = LocalDate.of(annee, period.moisDebut, 1).plusDays(offset);
        log.info("   📌 Date de départ: {}", dateCourante);

        int maxAttempts = 90;
        for (int i = 0; i < maxAttempts; i++) {
            LocalDate candidate = dateCourante.plusDays(i);

            if (candidate.getYear() != annee) {
                break;
            }

            int mois = candidate.getMonthValue();
            if (mois < period.moisDebut || mois > period.moisFin) {
                continue;
            }

            if (!holidayService.isValidDateForVisit(candidate)) {
                continue;
            }

            if (datesUtilisees.contains(candidate)) {
                log.debug("      📌 {}: déjà utilisée globalement", candidate);
                continue;
            }

            if (datesSite.contains(candidate)) {
                log.debug("      📌 {}: déjà utilisée par ce site", candidate);
                continue;
            }

            log.info("   ✅ Date trouvée pour {}: {}", site.getNom(), candidate);
            return candidate;
        }

        log.warn("   ⚠️ Aucune date trouvée pour {}", site.getNom());
        return null;
    }

    // service/impl/PlanningServiceImpl.java - AJOUTER cette méthode

    /**
     * ✅ Planifier les visites par zone géographique (Agadir → Marrakech → Casablanca → Rabat)
     */
    // service/impl/PlanningServiceImpl.java - REMPLACER COMPLÈTEMENT cette méthode

    @Transactional
    public void planifierVisitesParZone() {
        log.info("========================================");
        log.info("📍 PLANIFICATION PAR ZONE AVEC RESPECT DES PÉRIODES");
        log.info("========================================");

        // ✅ 1. Récupérer toutes les visites à planifier
        List<Client> clients = clientRepository.findByActifTrue();
        List<Planning> tousLesPlannings = new ArrayList<>();
        int anneeActuelle = LocalDate.now().getYear();

        for (Client client : clients) {
            if (client.getNbVisitesAn() == null || client.getNbVisitesAn() <= 0) continue;

            List<Site> sites = siteRepository.findByClientIdAndActifTrue(client.getId());
            for (Site site : sites) {
                // Géocoder si nécessaire
                if (site.getLatitude() == null || site.getLongitude() == null) {
                    geocodingService.geocodeSite(site);
                    siteRepository.save(site);
                    log.info("📍 Site {} géocodé: lat={}, lon={}",
                            site.getNom(), site.getLatitude(), site.getLongitude());
                }

                int nbVisitesAn = client.getNbVisitesAn();

                // ✅ Parcourir TOUS les numéros de visite (1 à nbVisitesAn)
                for (int numVisite = 1; numVisite <= nbVisitesAn; numVisite++) {
                    // ✅ Vérifier si cette visite existe déjà pour ce site
                    Set<Integer> numerosExistants = getNumerosExistantsPourSite(site, anneeActuelle);
                    if (numerosExistants.contains(numVisite)) {
                        continue; // Déjà planifiée
                    }

                    // ✅ Calculer la date selon la période
                    LocalDate dateVisite = calculerDateParPeriode(client, numVisite);  // ✅ DÉCLARATION

                    Planning planning = new Planning();
                    planning.setSite(site);
                    planning.setNumVisite(numVisite);
                    planning.setStatut(StatutVisite.EN_ATTENTE);
                    planning.setNbRelances(0);
                    planning.setDateEnvoi(LocalDateTime.now());
                    planning.setDateProposee(dateVisite);
                    planning.setDateVisite(dateVisite);

                    tousLesPlannings.add(planning);
                }
            }
        }

        if (tousLesPlannings.isEmpty()) {
            log.info("ℹ️ Aucune visite à planifier");
            return;
        }

        log.info("📊 {} visite(s) à planifier", tousLesPlannings.size());

        // ✅ 2. REGROUPER PAR ZONE GÉOGRAPHIQUE
        Map<String, List<Planning>> zones = regrouperParZoneGeographique(tousLesPlannings);
        log.info("📍 {} zones identifiées: {}", zones.size(), zones.keySet());

        // ✅ 3. Pour chaque zone, trier par numéro de visite (V1, V2, V3, V4)
        for (Map.Entry<String, List<Planning>> entry : zones.entrySet()) {
            List<Planning> planningsZone = entry.getValue();
            planningsZone.sort(Comparator.comparingInt(p -> p.getNumVisite() != null ? p.getNumVisite() : 0));
        }

        // ✅ 4. Définir l'ordre OPTIMAL des zones
        List<String> ordreZones = Arrays.asList("Centre", "Sud", "Nord", "Autre");

        // ✅ 5. Planifier zone par zone
        Set<LocalDate> datesUtilisees = new HashSet<>();

        for (String zone : ordreZones) {
            if (!zones.containsKey(zone)) continue;

            List<Planning> planningsZone = zones.get(zone);
            log.info("📍 Traitement de la zone: {} - {} visite(s)", zone, planningsZone.size());

            // ✅ Optimiser l'ordre des visites dans la zone
            List<Planning> zoneOptimisee = optimiserOrdreVisites(planningsZone);

            for (Planning planning : zoneOptimisee) {
                // ✅ Recalculer la date selon la période (V1, V2, V3, V4)
                Client client = planning.getSite().getClient();
                int numVisite = planning.getNumVisite();

                // ✅ Utiliser la date calculée par période
                LocalDate dateCalculee = calculerDateParPeriode(client, numVisite);

                // ✅ S'assurer que la date est valide et pas déjà utilisée
                LocalDate dateFinale = dateCalculee;
                int maxAttempts = 30;
                while (maxAttempts > 0 && (!holidayService.isValidDateForVisit(dateFinale) || datesUtilisees.contains(dateFinale))) {
                    dateFinale = dateFinale.plusDays(1);
                    maxAttempts--;
                }

                planning.setDateProposee(dateFinale);
                planning.setDateVisite(dateFinale);
                datesUtilisees.add(dateFinale);

                Planning saved = planningRepository.save(planning);
                String ville = extractVille(saved.getSite().getAdresse());
                String periode = getPeriodeLabel(numVisite, client.getNbVisitesAn());

                log.info("   ✅ V{} - {} ({}) - {} - Date: {}",
                        saved.getNumVisite(),
                        saved.getSite().getNom(),
                        ville,
                        periode,
                        dateFinale);

                try {
                    envoyerProposition(saved.getId());
                } catch (Exception e) {
                    log.error("❌ Erreur envoi email: {}", e.getMessage());
                }
            }
        }

        log.info("========================================");
        log.info("✅ PLANIFICATION PAR ZONE TERMINÉE");
        log.info("========================================");
    }

    /**
     * ✅ Obtenir le libellé de la période pour une visite
     */
    private String getPeriodeLabel(int numVisite, int nbVisitesAn) {
        if (nbVisitesAn == 4) {
            switch (numVisite) {
                case 1: return "Janv-Mars (V1)";
                case 2: return "Avr-Juin (V2)";
                case 3: return "Juil-Sept (V3)";
                case 4: return "Oct-Déc (V4)";
                default: return "Période inconnue";
            }
        } else if (nbVisitesAn == 2) {
            switch (numVisite) {
                case 1: return "Janv-Juin (V1)";
                case 2: return "Juil-Déc (V2)";
                default: return "Période inconnue";
            }
        }
        return "Période inconnue";
    }

    // service/impl/PlanningServiceImpl.java - AJOUTER cette méthode

    /**
     * ✅ Optimiser l'ordre des visites dans une zone (plus proche voisin)
     */
    private List<Planning> optimiserOrdreVisites(List<Planning> plannings) {
        if (plannings.size() <= 1) {
            return plannings;
        }

        List<Planning> nonVisites = new ArrayList<>(plannings);
        List<Planning> ordreOptimise = new ArrayList<>();

        // ✅ Démarrer du site le plus proche de Temara (ou du premier)
        Planning depart = nonVisites.remove(0);
        ordreOptimise.add(depart);

        Planning dernier = depart;
        int index = 1;

        log.info("   🔍 Optimisation de l'ordre dans la zone:");
        log.info("      Étape 0: {}", dernier.getSite().getNom());

        while (!nonVisites.isEmpty()) {
            Planning prochain = null;
            double distanceMin = Double.MAX_VALUE;

            for (Planning p : nonVisites) {
                if (p.getSite().getLatitude() != null && dernier.getSite().getLatitude() != null) {
                    double distance = geocodingService.calculateDistance(
                            dernier.getSite(),
                            p.getSite()
                    );
                    if (distance < distanceMin) {
                        distanceMin = distance;
                        prochain = p;
                    }
                }
            }

            if (prochain == null) {
                prochain = nonVisites.remove(0);
            } else {
                nonVisites.remove(prochain);
            }

            ordreOptimise.add(prochain);
            log.info("      Étape {}: {} → {} ({:.1f} km)",
                    index++,
                    dernier.getSite().getNom(),
                    prochain.getSite().getNom(),
                    distanceMin);

            dernier = prochain;
        }

        return ordreOptimise;
    }

    /**
     * ✅ Calculer la distance moyenne d'une zone depuis Temara
     */
    private double getDistanceMoyenneZone(List<Planning> plannings, Site temara) {
        if (plannings == null || plannings.isEmpty()) {
            return 999.0;
        }

        double totalDistance = 0.0;
        int count = 0;

        for (Planning planning : plannings) {
            Site site = planning.getSite();
            if (site.getLatitude() != null && site.getLongitude() != null) {
                totalDistance += geocodingService.calculateDistance(temara, site);
                count++;
            }
        }

        return count > 0 ? totalDistance / count : 999.0;
    }

    // service/impl/PlanningServiceImpl.java - AJOUTER cette méthode

    // service/impl/PlanningServiceImpl.java - AJOUTER cette méthode

    /**
     * ✅ Regrouper les visites par zone géographique (Nord, Centre, Sud)
     */
    private Map<String, List<Planning>> regrouperParZoneGeographique(List<Planning> plannings) {
        Map<String, List<Planning>> zones = new LinkedHashMap<>();

        // ✅ Définition des zones
        List<String> zoneNord = Arrays.asList(
                "tanger", "tetouan", "chefchaouen", "larache", "asilah",
                "fnideq", "martil", "m'diq", "al hoceima", "nador",
                "oujda", "berkane", "taourirt", "jerada", "saidia", "driouch"
        );

        List<String> zoneCentre = Arrays.asList(
                "casablanca", "rabat", "salé", "temara", "kenitra", "mohammedia",
                "benslimane", "bouznika", "berrechid", "settat", "el jadida",
                "azemmour", "khouribga", "oued zem", "sidi slimane", "sidi kacem",
                "meknes", "fes", "khemisset", "sefrou", "moulay yaacoub"
        );

        List<String> zoneSud = Arrays.asList(
                "agadir", "marrakech", "essaouira", "safi", "chichaoua",
                "el kelaa des sraghna", "youssoufia", "rehamna", "taroudannt",
                "tiznit", "ochtane", "biougra", "taliouine", "ouarzazate",
                "tinghir", "zagora", "rissani", "erfoud", "midelt",
                "guelmim", "tan-tan", "taghjijt", "bouizakarne", "sidi ifni",
                "laayoune", "boujdour", "tarfaya", "es-semara", "dakhla"
        );

        for (Planning p : plannings) {
            String ville = extractVille(p.getSite().getAdresse()).toLowerCase().trim();
            String zone = "Autre";

            if (zoneNord.contains(ville)) {
                zone = "Nord";
            } else if (zoneCentre.contains(ville)) {
                zone = "Centre";
            } else if (zoneSud.contains(ville)) {
                zone = "Sud";
            }

            zones.computeIfAbsent(zone, k -> new ArrayList<>()).add(p);
            log.debug("   📍 {} → Zone {}", ville, zone);
        }

        // ✅ Afficher le résumé des zones
        for (Map.Entry<String, List<Planning>> entry : zones.entrySet()) {
            log.info("📍 Zone {}: {} visite(s)", entry.getKey(), entry.getValue().size());
        }

        return zones;
    }


    /**
     * ✅ Trouver une date UNIQUE pour un site (vérifie en base directement)
     */
    private LocalDate trouverDateUnique(Site site, int numVisite, int annee,
                                        HolidayService.Period period, Set<LocalDate> datesUtilisees) {

        log.info("🔍 Recherche date UNIQUE pour V{} - {}", numVisite, site.getNom());

        // ✅ Récupérer les dates déjà utilisées par CE site (en base)
        Set<LocalDate> datesSite = new HashSet<>();
        List<Planning> planningsSite = planningRepository.findBySite(site);
        for (Planning p : planningsSite) {
            if (p.getDateProposee() != null && p.getStatut() != StatutVisite.ANNULE) {
                datesSite.add(p.getDateProposee());
            }
        }

        log.info("   📌 Dates du site {}: {}", site.getNom(), datesSite);
        log.info("   📌 Dates globales: {}", datesUtilisees);

        // ✅ Commencer au début de la période
        LocalDate dateCourante = LocalDate.of(annee, period.moisDebut, 1);
        int maxAttempts = 90;

        for (int i = 0; i < maxAttempts; i++) {
            LocalDate candidate = dateCourante.plusDays(i);

            // ✅ Vérifier l'année
            if (candidate.getYear() != annee) {
                break;
            }

            int mois = candidate.getMonthValue();

            // ✅ Vérifier que le mois est dans la période
            if (mois < period.moisDebut || mois > period.moisFin) {
                continue;
            }

            // ✅ Vérifier que la date est valide
            if (!holidayService.isValidDateForVisit(candidate)) {
                continue;
            }

            // ✅ Vérifier que la date n'est pas déjà utilisée (GLOBAL)
            if (datesUtilisees.contains(candidate)) {
                log.debug("      📌 {}: déjà utilisée globalement", candidate);
                continue;
            }

            // ✅ Vérifier que CE site n'a pas déjà une visite à cette date
            if (datesSite.contains(candidate)) {
                log.debug("      📌 {}: déjà utilisée par ce site", candidate);
                continue;
            }

            log.info("   ✅ Date trouvée pour {}: {}", site.getNom(), candidate);
            return candidate;
        }

        log.warn("   ⚠️ Aucune date trouvée dans la période pour {}", site.getNom());
        return null;
    }

    /**
     * ✅ Trouver une date dans la période avec décalage
     */
    private LocalDate trouverDateDansPeriode(Site site, int numVisite, int annee,
                                             HolidayService.Period period, Set<LocalDate> datesUtilisees, int offset) {

        log.info("🔍 Recherche V{} - {} (offset: {})", numVisite, site.getNom(), offset);

        // ✅ Date de départ = début de la période + offset
        LocalDate dateDepart = LocalDate.of(annee, period.moisDebut, 1).plusDays(offset);
        log.info("   📌 Date de départ: {}", dateDepart);

        // ✅ Récupérer les dates déjà utilisées par CE site
        Set<LocalDate> datesSite = new HashSet<>();
        List<Planning> planningsSite = planningRepository.findBySite(site);
        for (Planning p : planningsSite) {
            if (p.getDateProposee() != null && p.getStatut() != StatutVisite.ANNULE) {
                datesSite.add(p.getDateProposee());
            }
        }

        // ✅ Rechercher une date valide (max 90 jours pour rester dans la période)
        for (int i = 0; i < 90; i++) {
            LocalDate candidate = dateDepart.plusDays(i);

            // ✅ Vérifier que l'année est correcte
            if (candidate.getYear() != annee) {
                log.warn("   📌 Année changée: {} -> {}, arrêt recherche", annee, candidate.getYear());
                return null;
            }

            int mois = candidate.getMonthValue();

            // ✅ Vérifier que le mois est dans la période
            if (mois < period.moisDebut || mois > period.moisFin) {
                continue;
            }

            // ✅ Vérifier que la date est valide (pas week-end, pas férié, pas août)
            if (!holidayService.isValidDateForVisit(candidate)) {
                continue;
            }

            // ✅ Vérifier que la date n'est pas déjà utilisée
            if (datesUtilisees.contains(candidate)) {
                continue;
            }
            if (datesSite.contains(candidate)) {
                continue;
            }

            log.info("   ✅ Date trouvée: {}", candidate);
            return candidate;
        }

        log.warn("   ⚠️ Aucune date trouvée dans la période");
        return null;
    }

    /**
     * ✅ Trouver une date avec DECALAGE FORCE (ne dépasse pas l'année)
     */
    private LocalDate trouverDateAvecDecalageForce(Site site, int numVisite, int annee,
                                                   Set<LocalDate> datesUtilisees, int offset) {
        log.info("🔍 Recherche V{} - {} (offset: {}, année forcée: {})",
                numVisite, site.getNom(), offset, annee);

        try {
            Client client = site.getClient();
            int nbVisitesAn = client.getNbVisitesAn() != null ? client.getNbVisitesAn() : 4;

            HolidayService.Period period = holidayService.getPeriodForVisite(numVisite, nbVisitesAn);
            log.info("   📌 Période V{}: {}-{}", numVisite, period.moisDebut, period.moisFin);

            // ✅ Date de base = début de la période + offset
            LocalDate dateBase = LocalDate.of(annee, period.moisDebut, 1).plusDays(offset);
            log.info("   📌 Date de base: {}", dateBase);

            // ✅ Récupérer les dates du site
            Set<LocalDate> datesSite = new HashSet<>();
            List<Planning> planningsSite = planningRepository.findBySite(site);
            for (Planning p : planningsSite) {
                if (p.getDateProposee() != null && p.getStatut() != StatutVisite.ANNULE) {
                    datesSite.add(p.getDateProposee());
                }
            }

            // ✅ Recherche dans la période (max 90 jours pour rester dans la période)
            int maxAttempts = 90;
            for (int i = 0; i < maxAttempts; i++) {
                LocalDate candidate = dateBase.plusDays(i);
                int mois = candidate.getMonthValue();
                int anneeCandidate = candidate.getYear();

                // ✅ FORCER l'année
                if (anneeCandidate != annee) {
                    continue;
                }

                // ✅ Vérifier le mois
                if (mois < period.moisDebut || mois > period.moisFin) {
                    continue;
                }

                // ✅ Vérifier validité
                if (!holidayService.isValidDateForVisit(candidate)) {
                    continue;
                }

                // ✅ Vérifier doublons
                if (datesUtilisees.contains(candidate)) {
                    continue;
                }
                if (datesSite.contains(candidate)) {
                    continue;
                }

                log.info("   ✅ Date trouvée: {}", candidate);
                return candidate;
            }

            // ✅ Fallback : jour suivant dans la même année
            log.warn("   ⚠️ Aucune date trouvée, recherche jour par jour dans {}", annee);
            LocalDate fallback = LocalDate.of(annee, period.moisDebut, 1);
            for (int i = 0; i < 365; i++) {
                LocalDate candidate = fallback.plusDays(i);
                if (candidate.getYear() != annee) break;

                if (candidate.getMonthValue() < period.moisDebut || candidate.getMonthValue() > period.moisFin) {
                    continue;
                }
                if (!holidayService.isValidDateForVisit(candidate)) continue;
                if (datesUtilisees.contains(candidate)) continue;
                if (datesSite.contains(candidate)) continue;

                return candidate;
            }

            return null;

        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage(), e);
            return null;
        }
    }


    private LocalDate trouverDateAvecDecalage(Site site, int numVisite, int annee,
                                              Set<LocalDate> datesUtilisees, int offset) {
        log.info("🔍 Recherche de date pour V{} - {} (offset: {}, année: {})",
                numVisite, site.getNom(), offset, annee);

        try {
            Client client = site.getClient();
            int nbVisitesAn = client.getNbVisitesAn() != null ? client.getNbVisitesAn() : 4;

            HolidayService.Period period = holidayService.getPeriodForVisite(numVisite, nbVisitesAn);
            log.info("   📌 Période V{}: {}-{}", numVisite, period.moisDebut, period.moisFin);

            // ✅ Date de base = début de la période + DECALAGE
            LocalDate dateBase = LocalDate.of(annee, period.moisDebut, 1).plusDays(offset);
            log.info("   📌 Date de base (offset {}): {}", offset, dateBase);

            // ✅ Si la date est dans le passé, avancer
            LocalDate now = LocalDate.now();
            if (dateBase.isBefore(now) || dateBase.isEqual(now)) {
                dateBase = now.plusDays(1);
                log.info("   📌 Date ajustée (passée): {}", dateBase);
            }

            // ✅ Récupérer les dates déjà utilisées par CE site
            Set<LocalDate> datesSite = new HashSet<>();
            List<Planning> planningsSite = planningRepository.findBySite(site);
            for (Planning p : planningsSite) {
                if (p.getDateProposee() != null && p.getStatut() != StatutVisite.ANNULE) {
                    datesSite.add(p.getDateProposee());
                }
            }

            log.info("   📌 Dates déjà utilisées par {}: {}", site.getNom(), datesSite);
            log.info("   📌 Dates globales: {}", datesUtilisees);

            // ✅ Recherche d'une date valide
            int maxAttempts = 365;
            for (int i = 0; i < maxAttempts; i++) {
                LocalDate candidate = dateBase.plusDays(i);
                int mois = candidate.getMonthValue();
                int anneeCandidate = candidate.getYear();

                // ✅ Vérifier que l'année est correcte (2026, pas 2027)
                if (anneeCandidate != annee) {
                    log.debug("      📌 {}: année différente ({} != {})", candidate, anneeCandidate, annee);
                    continue;
                }

                // ✅ Vérifier que le mois est dans la période
                if (mois < period.moisDebut || mois > period.moisFin) {
                    log.debug("      📌 {}: hors période ({}-{})", candidate, period.moisDebut, period.moisFin);
                    continue;
                }

                // ✅ Vérifier que la date est valide
                if (!holidayService.isValidDateForVisit(candidate)) {
                    log.debug("      📌 {}: date invalide", candidate);
                    continue;
                }

                // ✅ Vérifier que la date n'est pas déjà utilisée (GLOBAL)
                if (datesUtilisees.contains(candidate)) {
                    log.debug("      📌 {}: déjà utilisée globalement", candidate);
                    continue;
                }

                // ✅ Vérifier que ce site n'a pas déjà une visite à cette date
                if (datesSite.contains(candidate)) {
                    log.debug("      📌 {}: site déjà occupé", candidate);
                    continue;
                }

                log.info("   ✅ Date trouvée pour {}: {}", site.getNom(), candidate);
                return candidate;
            }

            // ✅ Fallback : chercher dans la même année avec un décalage plus grand
            log.warn("   ⚠️ Aucune date trouvée en {}, recherche avec décalage +5", annee);
            return trouverDateAvecDecalage(site, numVisite, annee, datesUtilisees, offset + 5);

        } catch (Exception e) {
            log.error("❌ Erreur lors de la recherche: {}", e.getMessage(), e);
            return null;
        }
    }


    /**
     * ✅ Vérifier si une visite existe déjà pour un site spécifique
     */
    private boolean visiteExistePourSite(Site site, int numVisite) {
        List<Planning> plannings = planningRepository.findBySite(site);
        for (Planning p : plannings) {
            if (p.getNumVisite() != null && p.getNumVisite() == numVisite && p.getStatut() != StatutVisite.ANNULE) {
                return true;
            }
        }
        return false;
    }

    @Override
    @Transactional
    public void planifierPlageVisites(Integer clientId, Integer numVisiteDebut, Integer numVisiteFin) {
        log.info("📅 Planification des visites V{} à V{} pour le client ID: {}",
                numVisiteDebut, numVisiteFin, clientId);

        try {
            Client client = clientRepository.findById(clientId)
                    .orElseThrow(() -> new RuntimeException("Client non trouvé"));

            int nbVisitesAn = client.getNbVisitesAn() != null ? client.getNbVisitesAn() : 4;

            if (numVisiteDebut < 1) numVisiteDebut = 1;
            if (numVisiteFin > nbVisitesAn) numVisiteFin = nbVisitesAn;

            for (int i = numVisiteDebut; i <= numVisiteFin; i++) {
                try {
                    if (!visiteExiste(clientId, i) && !visiteEstAccepteeOuConfirmee(clientId, i)) {
                        planifierVisiteSpecifique(clientId, i);
                        log.info("✅ Visite V{} planifiée", i);
                    } else {
                        log.info("ℹ️ Visite V{} déjà planifiée ou acceptée", i);
                    }
                } catch (Exception e) {
                    log.error("❌ Erreur lors de la planification de V{}: {}", i, e.getMessage());
                }
            }

        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur: " + e.getMessage());
        }
    }

    // ============================================================
    // ✅ ACTIONS SUR LES VISITES
    // ============================================================

    @Override
    @Transactional
    public void relancerVisite(Integer planningId) {
        try {
            Planning planning = getPlanningById(planningId);

            if (planning.getStatut() != StatutVisite.REFUSE) {
                throw new RuntimeException("Seules les visites refusées peuvent être relancées");
            }

            Client client = planning.getSite().getClient();
            int numVisite = planning.getNumVisite();
            int anneeActuelle = LocalDate.now().getYear();

            Set<LocalDate> datesUtilisees = new HashSet<>();
            LocalDate nouvelleDate = planifierVisiteAvecPeriode(planning.getSite(), numVisite, anneeActuelle, datesUtilisees);

            if (nouvelleDate == null) {
                nouvelleDate = calculerDateParPeriodeEtAnnee(client, numVisite, anneeActuelle + 1);
            }

            planning.setDateProposee(nouvelleDate);
            planning.setDateVisite(nouvelleDate);
            planning.setStatut(StatutVisite.EN_ATTENTE);
            planning.setNbRelances(0);
            planning.setDateEnvoi(LocalDateTime.now());
            planning.setDateReponse(null);
            planningRepository.save(planning);

            envoyerProposition(planningId);

            log.info("🔄 Visite V{} relancée avec nouvelle date: {}", planning.getNumVisite(), nouvelleDate);

        } catch (Exception e) {
            log.error("❌ Erreur lors de la relance: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la relance", e);
        }
    }

    @Override
    @Transactional
    public void annulerVisite(Integer planningId) {
        try {
            Planning planning = getPlanningById(planningId);
            planning.setStatut(StatutVisite.ANNULE);
            planningRepository.save(planning);
            log.info("🗑️ Visite V{} annulée par l'administrateur", planning.getNumVisite());

            notificationService.notifierChangementStatut(planningId, planning.getStatut().name(), "ANNULE");

        } catch (Exception e) {
            log.error("❌ Erreur lors de l'annulation: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de l'annulation", e);
        }
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

            if (planning.getStatut() == StatutVisite.ACCEPTE ||
                    planning.getStatut() == StatutVisite.CONFIRME ||
                    planning.getStatut() == StatutVisite.REALISE) {
                log.warn("⚠️ La visite V{} est déjà acceptée/confirmée, pas d'envoi d'email", planning.getNumVisite());
                return;
            }

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

    @Override
    @Transactional
    public void traiterReponseClient(Integer planningId, boolean accepte) {
        try {
            Planning planning = getPlanningById(planningId);

            if (planning.getStatut() == StatutVisite.ACCEPTE ||
                    planning.getStatut() == StatutVisite.CONFIRME ||
                    planning.getStatut() == StatutVisite.REALISE) {
                log.warn("⚠️ La visite V{} a déjà été traitée (statut: {})",
                        planning.getNumVisite(), planning.getStatut());
                throw new RuntimeException("Cette visite a déjà été traitée et ne peut plus être modifiée.");
            }

            String ancienStatut = planning.getStatut() != null ? planning.getStatut().name() : "NON_DEFINI";
            planning.setDateReponse(LocalDateTime.now());

            if (accepte) {
                planning.setStatut(StatutVisite.ACCEPTE);
                planning.setDateConfirmee(planning.getDateProposee());
                planning.setDateVisite(planning.getDateProposee());

                emailService.sendConfirmationEmail(planning);
                notificationService.notifierChangementStatut(planningId, ancienStatut, "ACCEPTE");
                log.info("✅ Visite V{} acceptée par le client - Email de confirmation envoyé", planning.getNumVisite());

            } else {
                planning.setStatut(StatutVisite.REFUSE);
                notificationService.notifierChangementStatut(planningId, ancienStatut, "REFUSE");
                log.info("❌ Visite V{} refusée par le client - En attente de décision admin", planning.getNumVisite());
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
    // ✅ MÉTHODES DE VÉRIFICATION
    // ============================================================

    private boolean visiteExiste(Integer clientId, int numVisite) {
        List<Site> sites = siteRepository.findByClientIdAndActifTrue(clientId);
        for (Site site : sites) {
            List<Planning> plannings = planningRepository.findBySite(site);
            for (Planning p : plannings) {
                if (p.getNumVisite() != null &&
                        p.getNumVisite() == numVisite &&
                        p.getStatut() != StatutVisite.ANNULE) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean visiteEstAccepteeOuConfirmee(Integer clientId, int numVisite) {
        List<Site> sites = siteRepository.findByClientIdAndActifTrue(clientId);
        for (Site site : sites) {
            List<Planning> plannings = planningRepository.findBySite(site);
            for (Planning p : plannings) {
                if (p.getNumVisite() != null && p.getNumVisite() == numVisite) {
                    if (p.getStatut() == StatutVisite.ACCEPTE || p.getStatut() == StatutVisite.CONFIRME) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private LocalDate calculerDateParPeriodeEtAnnee(Client client, int numVisite, int annee) {
        int nbVisitesAn = client.getNbVisitesAn() != null ? client.getNbVisitesAn() : 4;
        HolidayService.Period period = holidayService.getPeriodForVisite(numVisite, nbVisitesAn);

        LocalDate now = LocalDate.now();
        int currentYear = now.getYear();
        int currentMonth = now.getMonthValue();

        if (annee == currentYear && currentMonth > period.moisFin) {
            annee = currentYear + 1;
        }

        LocalDate dateBase = LocalDate.of(annee, period.moisDebut, 1);

        if (dateBase.isBefore(now) || dateBase.isEqual(now)) {
            dateBase = dateBase.plusDays(1);
        }

        LocalDate dateValide = holidayService.findNextValidDateInPeriod(dateBase, period.moisDebut, period.moisFin);

        return dateValide;
    }

    private LocalDate calculerDateParPeriode(Client client, int numVisite) {
        int nbVisitesAn = client.getNbVisitesAn() != null ? client.getNbVisitesAn() : 4;

        HolidayService.Period period = holidayService.getPeriodForVisite(numVisite, nbVisitesAn);

        LocalDate now = LocalDate.now();
        int currentYear = now.getYear();
        int currentMonth = now.getMonthValue();

        // ✅ Déterminer l'année de planification
        int yearToUse = currentYear;

        // ✅ Pour V3 (mois 7-9), on vérifie si on est passé septembre
        // Si on est en août, on reste en année en cours
        if (currentMonth > period.moisFin) {
            // Si le mois actuel est APRÈS la fin de la période → année suivante
            yearToUse = currentYear + 1;
            log.info("📌 Période {}-{} passée (mois actuel: {}), planification en {}",
                    period.moisDebut, period.moisFin, currentMonth, yearToUse);
        } else {
            yearToUse = currentYear;
            log.info("📌 Période {}-{} en cours ou future (mois actuel: {}), planification en {}",
                    period.moisDebut, period.moisFin, currentMonth, yearToUse);
        }

        // ✅ Créer la date de base = début de la période
        LocalDate dateBase = LocalDate.of(yearToUse, period.moisDebut, 1);

        // ✅ Si la date est dans le passé, avancer d'un jour
        if (dateBase.isBefore(now) || dateBase.isEqual(now)) {
            dateBase = dateBase.plusDays(1);
            log.info("📌 Date de base ajustée: {}", dateBase);
        }

        // ✅ Pour V3 (mois 7-9) et V2 (2 visites/an), exclure AOUT explicitement
        LocalDate dateValide;
        boolean isV3 = (period.moisDebut == 7 && period.moisFin == 9);
        boolean isV2With2Visits = (nbVisitesAn == 2 && period.moisDebut == 7 && period.moisFin == 12);

        if (isV3 || isV2With2Visits) {
            dateValide = holidayService.findNextValidDateInPeriodExcludingAugust(dateBase, period.moisDebut, period.moisFin);
            log.info("📌 V{} - Août exclu explicitement", numVisite);
        } else {
            dateValide = holidayService.findNextValidDateInPeriod(dateBase, period.moisDebut, period.moisFin);
        }

        log.info("📅 Visite V{} planifiée le {} (période: {}-{}, année: {})",
                numVisite, dateValide, period.moisDebut, period.moisFin, yearToUse);

        return dateValide;
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

    @Override
    public List<PlanningDTO> convertToDTOList(List<Planning> plannings) {
        return plannings.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
}