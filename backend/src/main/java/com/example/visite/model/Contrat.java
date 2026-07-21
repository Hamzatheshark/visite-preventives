package com.example.visite.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Contrat")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Contrat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "contrats"})
    private Client client;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    @Column(name = "nb_visites_an", nullable = false)
    private Integer nbVisitesAn;

    @Column(name = "montant_ht")
    private Double montantHt;

    @Column(name = "type_renouvellement", length = 255)
    private String typeRenouvellement;

    @Column(name = "date_facturation", length = 255)
    private String dateFacturation;

    @Column(nullable = false)
    private Boolean actif = true;

    @OneToMany(mappedBy = "contrat", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "contrat"})
    private List<Planning> plannings = new ArrayList<>();
}