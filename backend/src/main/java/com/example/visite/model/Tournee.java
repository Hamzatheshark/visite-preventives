// model/Tournee.java
package com.example.visite.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tournee")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tournee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "date_tournee", nullable = false)
    private LocalDate dateTournee;

    @Column(name = "ville_depart")
    private String villeDepart;

    @Column(name = "ville_arrivee")
    private String villeArrivee;

    @Column(name = "distance_totale_km")
    private Double distanceTotaleKm;

    @OneToMany(mappedBy = "tournee", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Planning> plannings = new ArrayList<>();
}