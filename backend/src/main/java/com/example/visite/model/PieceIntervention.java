// model/PieceIntervention.java - Version complète pour H2
package com.example.visite.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "piece_intervention")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PieceIntervention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planning_id", nullable = false)
    private Planning planning;

    @Column(name = "nom_fichier", nullable = false, length = 255)
    private String nomFichier;

    @Column(name = "chemin_fichier", nullable = false, length = 500)
    private String cheminFichier;

    @Column(name = "type_fichier", length = 100)
    private String typeFichier;

    @Column(name = "taille")
    private Long taille;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "date_upload", nullable = false)
    @CreationTimestamp
    private LocalDateTime dateUpload;

    @Column(name = "upload_par", length = 255)
    private String uploadPar;
}