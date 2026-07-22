package com.example.visite.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientDTO {
    private Integer id;
    private String nom;
    private String code;
    private String emailContact;
    private String telephone;
    private String adresseSiege;
    private Integer nbVisitesAn;
    private Boolean actif;
    private LocalDateTime dateCreation;

    // ✅ AJOUTER siteNom (sera rempli depuis sites[0].nom)
    private String siteNom;
}