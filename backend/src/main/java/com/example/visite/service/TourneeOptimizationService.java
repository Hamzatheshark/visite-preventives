// service/TourneeOptimizationService.java
package com.example.visite.service;

import com.example.visite.model.Planning;
import com.example.visite.model.Site;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors; // ✅ AJOUTER CET IMPORT

@Service
@RequiredArgsConstructor
@Slf4j
public class TourneeOptimizationService {

    private final GeocodingService geocodingService;
    private final RouteOptimizationService routeOptimizationService;

    // Coordonnées de Temara (siège RMS)
    private static final double TEMARA_LAT = 33.9286;
    private static final double TEMARA_LON = -6.9020;

    /**
     * Calculer la distance depuis Temara
     */
    public double calculateDistanceFromTemara(Site site) {
        if (site.getLatitude() == null || site.getLongitude() == null) {
            return Double.MAX_VALUE;
        }

        Site temara = new Site();
        temara.setLatitude(TEMARA_LAT);
        temara.setLongitude(TEMARA_LON);

        return geocodingService.calculateDistance(temara, site);
    }

    /**
     * Trier les visites par distance depuis Temara (plus proche d'abord)
     */
    public List<Planning> sortByDistanceFromTemara(List<Planning> plannings) {
        return plannings.stream()
                .sorted(Comparator.comparingDouble(p -> calculateDistanceFromTemara(p.getSite())))
                .collect(Collectors.toList()); // ✅ Collectors est maintenant importé
    }

    /**
     * Planifier les tournées : une visite par jour, ordre optimisé depuis Temara
     */
    public Map<LocalDate, List<Planning>> planifierTournees(List<Planning> plannings, LocalDate dateDebut) {
        Map<LocalDate, List<Planning>> journeeMap = new LinkedHashMap<>();
        LocalDate currentDate = dateDebut;

        // 1️⃣ D'abord, regrouper par zone géographique (Agadir, Marrakech, etc.)
        Map<String, List<Planning>> zones = routeOptimizationService.groupByZone(plannings, 50);

        // 2️⃣ Pour chaque zone, trier les visites par distance depuis Temara
        for (Map.Entry<String, List<Planning>> entry : zones.entrySet()) {
            String zone = entry.getKey();
            List<Planning> zonePlannings = entry.getValue();

            // Trier par distance depuis Temara (plus proche d'abord)
            List<Planning> sortedPlannings = sortByDistanceFromTemara(zonePlannings);

            // Assigner les dates (une par jour)
            for (Planning planning : sortedPlannings) {
                while (currentDate.getDayOfWeek().getValue() > 5) {
                    currentDate = currentDate.plusDays(1);
                }

                planning.setDateVisite(currentDate);
                planning.setDateProposee(currentDate);

                journeeMap.computeIfAbsent(currentDate, k -> new ArrayList<>()).add(planning);

                String ville = extractVille(planning.getSite().getAdresse());
                double distance = calculateDistanceFromTemara(planning.getSite());

                log.info("📅 Jour {} - Visite V{} - {} ({} km depuis Temara)",
                        currentDate,
                        planning.getNumVisite(),
                        ville,
                        String.format("%.1f", distance));

                currentDate = currentDate.plusDays(1);
            }
        }

        return journeeMap;
    }

    /**
     * Extraire la ville d'une adresse
     */
    private String extractVille(String adresse) {
        if (adresse == null || adresse.isEmpty()) {
            return "Inconnu";
        }
        String[] parts = adresse.split(",");
        return parts.length >= 2 ? parts[parts.length - 1].trim() : adresse;
    }
}