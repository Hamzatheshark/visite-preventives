package com.example.visite.model;

import com.example.visite.model.enums.RoleUtilisateur;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Utilisateur")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Utilisateur {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 100)
    private String prenom;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, length = 255)
    private String motPasse;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private RoleUtilisateur role;

    @Column(length = 50)
    private String telephone;

    @Column(nullable = false)
    private Boolean actif = true;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    @OneToMany(mappedBy = "technicien", fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private List<Planning> visitesTechnicien = new ArrayList<>();

    @OneToMany(mappedBy = "responsable", fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private List<Planning> visitesResponsable = new ArrayList<>();
}