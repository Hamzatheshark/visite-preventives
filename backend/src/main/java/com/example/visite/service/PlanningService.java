// service/PlanningService.java - Version finale COMPLETE
package com.example.visite.service;

import com.example.visite.model.Planning;
import com.example.visite.model.enums.StatutVisite;
import com.example.visite.dto.PlanningDTO;
import java.time.LocalDate;
import java.util.List;

public interface PlanningService {
    // CRUD
    Planning createPlanning(Planning planning);
    Planning updatePlanning(Planning planning);
    void deletePlanning(Integer id);
    Planning getPlanningById(Integer id);
    List<Planning> getAllPlannings();

    // Recherches
    List<Planning> getPlanningsByStatut(StatutVisite statut);
    List<Planning> getPlanningsBySite(Integer siteId);
    List<Planning> getPlanningsByDateRange(LocalDate start, LocalDate end);
    List<Planning> getPlanningsByTechnicien(Integer technicienId);
    List<Planning> getPlanningsByResponsable(Integer responsableId);
    List<Planning> getVisitesSansPI();
    List<Planning> getPlanningsSansResponsable();

    // PLANIFICATION
    void planifierVisitesPourClient(Integer clientId);
    int planifierVisitesPourTousLesClients();

    // ✅ NOUVELLES MÉTHODES POUR LA PLANIFICATION PROGRESSIVE
    void planifierProchaineVisite(Integer clientId);
    void planifierToutesVisitesManquantes(Integer clientId);

    // Actions
    void envoyerProposition(Integer planningId);
    void traiterReponseClient(Integer planningId, boolean accepte);
    void gererRelance(Integer planningId);
    void assignerTechnicien(Integer planningId, Integer technicienId);
    void assignerResponsable(Integer planningId, Integer responsableId);
    void marquerRealise(Integer planningId, String resultat);
    void marquerTerminee(Integer planningId);
    void annulerAssignmentResponsable(Integer planningId);
    void annulerAssignmentTechnicien(Integer planningId);
    int planifierProchaineVisitePourTousLesClients();
    // Notifications
    void notifierChangementStatut(Integer planningId, String ancienStatut, String nouveauStatut);
    // service/PlanningService.java - Ajouter cette méthode
    void annulerVisite(Integer planningId);
    // Conversion DTO
    PlanningDTO convertToDTO(Planning planning);
    List<PlanningDTO> convertToDTOList(List<Planning> plannings);
}