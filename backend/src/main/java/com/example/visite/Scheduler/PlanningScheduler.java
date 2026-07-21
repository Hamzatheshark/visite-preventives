// scheduler/PlanningScheduler.java
package com.example.visite.Scheduler;

import com.example.visite.model.Planning;
import com.example.visite.model.enums.StatutVisite;
import com.example.visite.repository.PlanningRepository;
import com.example.visite.service.PlanningService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PlanningScheduler {

    private final PlanningRepository planningRepository;
    private final PlanningService planningService;

    // Exécute tous les jours à 9h00
    @Scheduled(cron = "0 0 9 * * *")
    public void checkPendingVisits() {
        try {
            log.info("Checking pending visits for relance...");
            List<Planning> pendingVisits = planningRepository.findByStatut(StatutVisite.EN_ATTENTE);

            for (Planning planning : pendingVisits) {
                if (planning.getDateEnvoi() != null) {
                    long daysSinceEnvoi = ChronoUnit.DAYS.between(
                            planning.getDateEnvoi().toLocalDate(),
                            LocalDate.now()
                    );

                    // Si plus de 7 jours et moins de 2 relances
                    if (daysSinceEnvoi >= 7 && planning.getNbRelances() != null && planning.getNbRelances() < 2) {
                        log.info("Sending relance for planning ID: {}", planning.getId());
                        planningService.gererRelance(planning.getId());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error in checkPendingVisits", e);
        }
    }

    // Exécute tous les jours à 8h00 le premier jour du mois
    @Scheduled(cron = "0 0 8 1 * *")
    public void generateMonthlyVisits() {
        try {
            log.info("Generating monthly visits...");
            // TODO: Implémenter la génération automatique des visites
        } catch (Exception e) {
            log.error("Error in generateMonthlyVisits", e);
        }
    }
}