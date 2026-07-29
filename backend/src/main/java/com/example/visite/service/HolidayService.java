// service/HolidayService.java - COMPLET CORRIGÉ
package com.example.visite.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.Set;

@Service
@Slf4j
public class HolidayService {

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Classe interne pour les périodes
     */
    public static class Period {
        public int moisDebut;
        public int moisFin;

        public Period(int moisDebut, int moisFin) {
            this.moisDebut = moisDebut;
            this.moisFin = moisFin;
        }
    }

    /**
     * Récupérer les jours fériés depuis l'API (Maroc)
     */
    public Set<LocalDate> getHolidays(int year) {
        try {
            String url = "https://calendrier.api.gouv.fr/jours-feries/maroc/" + year + ".json";

            log.info("📅 Récupération des jours fériés pour {}", year);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(java.time.Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode json = objectMapper.readTree(response.body());
                Set<LocalDate> holidays = new HashSet<>();

                json.fields().forEachRemaining(entry -> {
                    String dateStr = entry.getKey();
                    String name = entry.getValue().asText();
                    LocalDate date = LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
                    holidays.add(date);
                    log.debug("🗓️ Jour férié: {} - {}", date, name);
                });

                log.info("✅ {} jours fériés récupérés pour {}", holidays.size(), year);
                return holidays;
            } else {
                log.warn("⚠️ Erreur API: {}, utilisation des jours fériés par défaut", response.statusCode());
                return getDefaultHolidays(year);
            }

        } catch (IOException | InterruptedException e) {
            log.error("❌ Erreur lors de la récupération des jours fériés: {}", e.getMessage());
            return getDefaultHolidays(year);
        }
    }

    /**
     * Jours fériés par défaut (Maroc)
     */
    private Set<LocalDate> getDefaultHolidays(int year) {
        Set<LocalDate> holidays = new HashSet<>();

        holidays.add(LocalDate.of(year, 1, 1));   // Nouvel An
        holidays.add(LocalDate.of(year, 1, 11));  // Manifeste de l'Indépendance
        holidays.add(LocalDate.of(year, 5, 1));   // Fête du Travail
        holidays.add(LocalDate.of(year, 7, 30));  // Fête du Trône
        holidays.add(LocalDate.of(year, 8, 14));  // Oued Ed-Dahab
        holidays.add(LocalDate.of(year, 8, 20));  // Révolution du Roi et du Peuple
        holidays.add(LocalDate.of(year, 8, 21));  // Fête de la Jeunesse
        holidays.add(LocalDate.of(year, 11, 6));  // Marche Verte
        holidays.add(LocalDate.of(year, 11, 18)); // Fête de l'Indépendance

        return holidays;
    }

    /**
     * Vérifier si une date est un jour férié
     */
    public boolean isHoliday(LocalDate date) {
        int year = date.getYear();
        Set<LocalDate> holidays = getHolidays(year);
        return holidays.contains(date);
    }

    /**
     * Vérifier si une date est valide pour une visite
     */
    public boolean isValidDateForVisit(LocalDate date) {
        // Week-end (samedi = 6, dimanche = 7)
        if (date.getDayOfWeek().getValue() > 5) {
            return false;
        }

        // Mois d'août (vacances)
        if (date.getMonth() == Month.AUGUST) {
            return false;
        }

        // Jours fériés
        if (isHoliday(date)) {
            return false;
        }

        return true;
    }

    /**
     * Trouver la prochaine date valide (après la date donnée)
     */
    public LocalDate findNextValidDate(LocalDate date) {
        LocalDate candidate = date;
        int maxAttempts = 365;

        while (maxAttempts > 0) {
            if (isValidDateForVisit(candidate)) {
                return candidate;
            }
            candidate = candidate.plusDays(1);
            maxAttempts--;
        }

        return date;
    }

    /**
     * Trouver la prochaine date valide dans une période donnée
     * ✅ CORRIGÉE : Utilise isValidDateForVisit qui exclut août
     */
    public LocalDate findNextValidDateInPeriod(LocalDate date, int moisDebut, int moisFin) {
        LocalDate candidate = date;
        int maxAttempts = 365;

        while (maxAttempts > 0) {
            int mois = candidate.getMonthValue();

            // Vérifier que le mois est dans la période
            if (mois >= moisDebut && mois <= moisFin) {
                // ✅ Utilise isValidDateForVisit (exclut août, week-ends, jours fériés)
                if (isValidDateForVisit(candidate)) {
                    return candidate;
                }
            }
            candidate = candidate.plusDays(1);
            maxAttempts--;
        }

        return date;
    }

    /**
     * Trouver la prochaine date valide dans une période donnée
     * ✅ Version spéciale pour V3 qui exclut AOUT explicitement
     */
    public LocalDate findNextValidDateInPeriodExcludingAugust(LocalDate date, int moisDebut, int moisFin) {
        LocalDate candidate = date;
        int maxAttempts = 365;

        while (maxAttempts > 0) {
            int mois = candidate.getMonthValue();

            // Vérifier que le mois est dans la période
            if (mois >= moisDebut && mois <= moisFin) {
                // ✅ Exclure AOUT explicitement
                if (mois != 8 && isValidDateForVisit(candidate)) {
                    return candidate;
                }
            }
            candidate = candidate.plusDays(1);
            maxAttempts--;
        }

        return date;
    }

    /**
     * Obtenir la période pour un numéro de visite
     * V1: Janv-Mars (1-3)
     * V2: Avril-Juin (4-6)
     * V3: Juillet-Septembre (7-9) - Août exclu
     * V4: Octobre-Décembre (10-12)
     */
    public Period getPeriodForVisite(int numVisite, int nbVisitesAn) {
        if (nbVisitesAn == 4) {
            switch (numVisite) {
                case 1: return new Period(1, 3);   // Janvier - Mars
                case 2: return new Period(4, 6);   // Avril - Juin
                case 3: return new Period(7, 9);   // Juillet - Septembre (Août exclu)
                case 4: return new Period(10, 12); // Octobre - Décembre
                default: return new Period(1, 12);
            }
        } else if (nbVisitesAn == 2) {
            switch (numVisite) {
                case 1: return new Period(1, 6);   // Janvier - Juin
                case 2: return new Period(7, 12);  // Juillet - Décembre (Août exclu)
                default: return new Period(1, 12);
            }
        }
        return new Period(1, 12);
    }
}