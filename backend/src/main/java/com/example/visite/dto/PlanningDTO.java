// dto/PlanningDTO.java
package com.example.visite.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlanningDTO {
    private Integer id;
    private Integer numVisite;
    private LocalDate dateProposee;
    private LocalDate dateConfirmee;
    private LocalDate dateVisite;
    private String statut;
    private LocalDateTime dateEnvoi;
    private LocalDateTime dateReponse;
    private Integer nbRelances;
    private LocalDateTime dateRelance;
    private String resultat;
    private LocalDateTime dateRealisation;

    // Client
    private Integer clientId;
    private String clientNom;
    private String clientEmail;
    private String clientCode;

    // Site
    private Integer siteId;
    private String siteNom;
    private String siteAdresse;
    private String siteEmailContact;
    private String siteTelephone;

    // Technicien
    private Integer technicienId;
    private String technicienNom;
    private String technicienPrenom;
    private String technicienEmail;

    // ✅ Responsable (NOUVEAU)
    private Integer responsableId;
    private String responsableNom;
    private String responsablePrenom;
    private String responsableEmail;

    // Contrat
    private Integer contratId;
    private LocalDate contratDateDebut;
    private LocalDate contratDateFin;
    private Integer nbVisitesAn;

    // PI
    private Boolean hasPieceIntervention;
    private Integer pieceInterventionId;
}