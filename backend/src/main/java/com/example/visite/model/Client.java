package com.example.visite.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Client")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Client {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 255)
    private String nom;

    @Column(length = 50)
    private String code;

    @Column(length = 255)
    private String emailContact;

    @Column(length = 50)
    private String telephone;

    @Column(length = 500)
    private String adresseSiege;

    @Column(name = "nb_visites_an")
    private Integer nbVisitesAn = 4;

    @Column(nullable = false)
    private Boolean actif = true;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "client"})
    private List<Site> sites = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Contrat> contrats = new ArrayList<>();
}