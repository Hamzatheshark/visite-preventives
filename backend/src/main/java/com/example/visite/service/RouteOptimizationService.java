// service/RouteOptimizationService.java - CORRIGÉ
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
public class RouteOptimizationService {

    private final GeocodingService geocodingService;
    private final HolidayService holidayService;

    // Coordonnées de Temara (siège RMS)
    private static final double TEMARA_LAT = 33.9286;
    private static final double TEMARA_LON = -6.9020;

    /**
     * Grouper les visites par zone géographique avec rayon dynamique
     */
    public Map<String, List<Planning>> groupByZone(List<Planning> plannings, double rayonKm) {
        Map<String, List<Planning>> zones = new LinkedHashMap<>();
        List<Planning> nonAffectes = new ArrayList<>(plannings);

        log.info("📍 Regroupement de {} visites par zone (rayon: {} km)", plannings.size(), rayonKm);

        while (!nonAffectes.isEmpty()) {
            Planning reference = nonAffectes.remove(0);
            List<Planning> groupe = new ArrayList<>();
            groupe.add(reference);

            String ville = extractVille(reference.getSite().getAdresse());
            String nomZone = ville + "_" + (zones.size() + 1);

            log.info("📍 Zone {} - Ville: {}, Rayon: {} km", nomZone, ville, rayonKm);

            Iterator<Planning> iterator = nonAffectes.iterator();
            while (iterator.hasNext()) {
                Planning p = iterator.next();
                double distance = geocodingService.calculateDistance(
                        reference.getSite(),
                        p.getSite()
                );

                if (distance <= rayonKm) {
                    groupe.add(p);
                    iterator.remove();
                    log.debug("   📍 Ajout de la visite V{} (distance: {:.1f} km)",
                            p.getNumVisite(), distance);
                }
            }

            zones.put(nomZone, groupe);
            log.info("📍 Zone {}: {} visite(s)", nomZone, groupe.size());
        }

        return zones;
    }

    /**
     * Optimiser l'ordre des visites dans une zone (plus court chemin)
     */
    public List<Planning> optimizeRoute(List<Planning> plannings) {
        if (plannings.size() <= 1) {
            return plannings;
        }

        List<Planning> optimized = new ArrayList<>();
        Planning current = plannings.get(0);
        optimized.add(current);

        List<Planning> remaining = new ArrayList<>(plannings);
        remaining.remove(current);

        while (!remaining.isEmpty()) {
            Planning next = findNearest(current, remaining);
            optimized.add(next);
            remaining.remove(next);
            current = next;
        }

        return optimized;
    }

    private Planning findNearest(Planning current, List<Planning> candidates) {
        Planning nearest = null;
        double minDistance = Double.MAX_VALUE;

        for (Planning candidate : candidates) {
            double distance = geocodingService.calculateDistance(
                    current.getSite(),
                    candidate.getSite()
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearest = candidate;
            }
        }

        return nearest;
    }

    /**
     * Planifier les visites par zone et par jour (une visite par jour)
     */
    public Map<LocalDate, List<Planning>> planifierParJourAvecZones(List<Planning> plannings, double rayonKm) {
        Map<LocalDate, List<Planning>> journeeMap = new LinkedHashMap<>();

        Map<String, List<Planning>> zones = groupByZone(plannings, rayonKm);
        LocalDate currentDate = LocalDate.now().plusDays(1);

        Set<LocalDate> datesUtilisees = new HashSet<>();

        for (Map.Entry<String, List<Planning>> entry : zones.entrySet()) {
            String zoneName = entry.getKey();
            List<Planning> zonePlannings = optimizeRoute(entry.getValue());

            log.info("📍 Traitement de la zone {} - {} visites", zoneName, zonePlannings.size());

            for (Planning planning : zonePlannings) {
                LocalDate date = currentDate;
                int maxAttempts = 365;

                while (maxAttempts > 0) {
                    if (holidayService.isValidDateForVisit(date)) {
                        if (!datesUtilisees.contains(date)) {
                            break;
                        }
                    }
                    date = date.plusDays(1);
                    maxAttempts--;
                }

                datesUtilisees.add(date);
                currentDate = date.plusDays(1);

                journeeMap.computeIfAbsent(date, k -> new ArrayList<>()).add(planning);

                String ville = extractVille(planning.getSite().getAdresse());
                log.info("📅 Visite V{} planifiée pour {} ({}) le {}",
                        planning.getNumVisite(),
                        planning.getSite().getNom(),
                        ville,
                        date);
            }
        }

        return journeeMap;
    }

    /**
     * Planifier les visites par jour simple (une visite par jour)
     */
    public Map<LocalDate, List<Planning>> planifierParJourSimple(List<Planning> plannings) {
        Map<LocalDate, List<Planning>> journeeMap = new LinkedHashMap<>();
        LocalDate currentDate = LocalDate.now().plusDays(1);

        Set<LocalDate> datesUtilisees = new HashSet<>();

        // ✅ Grouper par ville - Utiliser Collectors.toList()
        Map<String, List<Planning>> planningsParVille = plannings.stream()
                .collect(Collectors.groupingBy(p -> extractVille(p.getSite().getAdresse())));

        for (Map.Entry<String, List<Planning>> entry : planningsParVille.entrySet()) {
            String ville = entry.getKey();
            List<Planning> planningsVille = entry.getValue();

            log.info("📍 {} visite(s) pour la ville {}", planningsVille.size(), ville);

            for (Planning planning : planningsVille) {
                LocalDate date = currentDate;
                int maxAttempts = 365;

                while (maxAttempts > 0) {
                    if (holidayService.isValidDateForVisit(date)) {
                        if (!datesUtilisees.contains(date)) {
                            break;
                        }
                    }
                    date = date.plusDays(1);
                    maxAttempts--;
                }

                datesUtilisees.add(date);
                currentDate = date.plusDays(1);

                journeeMap.computeIfAbsent(date, k -> new ArrayList<>()).add(planning);

                log.info("📅 Visite V{} planifiée pour {} ({}) le {}",
                        planning.getNumVisite(),
                        planning.getSite().getNom(),
                        ville,
                        date);
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
        if (parts.length >= 2) {
            String ville = parts[parts.length - 1].trim();
            ville = ville.replaceAll("\\d{5}", "").trim();
            return ville;
        }
        return adresse.substring(0, Math.min(20, adresse.length()));
    }

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
}