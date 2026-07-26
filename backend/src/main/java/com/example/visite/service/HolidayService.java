// service/HolidayService.java
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
}