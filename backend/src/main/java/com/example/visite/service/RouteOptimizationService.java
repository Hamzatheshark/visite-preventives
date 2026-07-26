// service/RouteOptimizationService.java
package com.example.visite.service;

import com.example.visite.model.Planning;
import com.example.visite.model.Site;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RouteOptimizationService {

    private final GeocodingService geocodingService;

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

    public Map<LocalDate, List<Planning>> planifierParJourAvecZones(List<Planning> plannings, double rayonKm) {
        Map<LocalDate, List<Planning>> journeeMap = new LinkedHashMap<>();

        Map<String, List<Planning>> zones = groupByZone(plannings, rayonKm);
        LocalDate currentDate = LocalDate.now().plusDays(1);

        for (Map.Entry<String, List<Planning>> entry : zones.entrySet()) {
            List<Planning> zonePlannings = optimizeRoute(entry.getValue());

            for (Planning planning : zonePlannings) {
                while (currentDate.getDayOfWeek().getValue() > 5) {
                    currentDate = currentDate.plusDays(1);
                }

                journeeMap.computeIfAbsent(currentDate, k -> new ArrayList<>()).add(planning);

                log.info("📅 Visite V{} planifiée pour le {} le {}",
                        planning.getNumVisite(),
                        planning.getSite().getNom(),
                        currentDate);

                currentDate = currentDate.plusDays(1);
            }
        }

        return journeeMap;
    }

    public Map<LocalDate, List<Planning>> planifierParJourSimple(List<Planning> plannings) {
        Map<LocalDate, List<Planning>> journeeMap = new LinkedHashMap<>();
        LocalDate currentDate = LocalDate.now().plusDays(1);

        for (Planning planning : plannings) {
            while (currentDate.getDayOfWeek().getValue() > 5) {
                currentDate = currentDate.plusDays(1);
            }

            journeeMap.computeIfAbsent(currentDate, k -> new ArrayList<>()).add(planning);
            planning.setDateVisite(currentDate);

            log.info("📅 Visite V{} planifiée pour le {} le {}",
                    planning.getNumVisite(),
                    planning.getSite().getNom(),
                    currentDate);

            currentDate = currentDate.plusDays(1);
        }

        return journeeMap;
    }

    private String extractVille(String adresse) {
        if (adresse == null || adresse.isEmpty()) {
            return "Inconnu";
        }

        String[] parts = adresse.split(",");
        if (parts.length >= 2) {
            return parts[parts.length - 1].trim();
        }
        return adresse.substring(0, Math.min(20, adresse.length()));
    }
}