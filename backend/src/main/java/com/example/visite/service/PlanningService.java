// service/PlanningService.java
package com.example.visite.service;

import com.example.visite.model.Planning;
import com.example.visite.model.enums.StatutVisite;
import com.example.visite.dto.PlanningDTO;
import java.time.LocalDate;
import java.util.List;

public interface PlanningService {
    Planning createPlanning(Planning planning);
    Planning updatePlanning(Planning planning);
    void deletePlanning(Integer id);
    Planning getPlanningById(Integer id);
    List<Planning> getAllPlannings();
    List<Planning> getPlanningsByStatut(StatutVisite statut);
    List<Planning> getPlanningsBySite(Integer siteId);
    List<Planning> getPlanningsByDateRange(LocalDate start, LocalDate end);
    void planifierAutomatiquement(Integer contratId);
    void envoyerProposition(Integer planningId);
    void traiterReponseClient(Integer planningId, boolean accepte);
    void gererRelance(Integer planningId);
    void assignerTechnicien(Integer planningId, Integer technicienId);
    void assignerResponsable(Integer planningId, Integer responsableId);
    void marquerRealise(Integer planningId, String resultat);
    List<Planning> getVisitesSansPI();

    // Conversion DTO
    PlanningDTO convertToDTO(Planning planning);
    List<PlanningDTO> convertToDTOList(List<Planning> plannings);
}