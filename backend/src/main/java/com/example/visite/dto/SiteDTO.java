package com.example.visite.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SiteDTO {
    private Integer id;
    private String nom;
    private String adresse;
    private Double latitude;
    private Double longitude;
    private String emailContact;
    private String telephone;
    private Boolean actif;
    private Integer clientId;
    private String clientNom;
}