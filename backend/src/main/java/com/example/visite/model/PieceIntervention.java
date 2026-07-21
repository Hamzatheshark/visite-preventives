package com.example.visite.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "PieceIntervention")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PieceIntervention {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planning_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "pieceIntervention"})
    private Planning planning;

    @Column(name = "nom_fichier", nullable = false)
    private String nomFichier;

    @Column(name = "chemin_fichier", nullable = false)
    private String cheminFichier;

    @Column(name = "type_fichier")
    private String typeFichier;

    @Column(name = "taille_fichier")
    private Long tailleFichier;

    @Column(name = "date_upload", nullable = false)
    private LocalDateTime dateUpload = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String description;
}