package com.example.visite.model;

import com.example.visite.model.enums.StatutVisite;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList; // ✅ AJOUTER
import java.util.List;     // ✅ AJOUTER

@Entity
@Table(name = "Planning")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Planning {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "plannings"})
    private Site site;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contrat_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "plannings"})
    private Contrat contrat;

    @Column(name = "num_visite")
    private Integer numVisite;

    @Column(name = "date_proposee")
    private LocalDate dateProposee;

    @Column(name = "date_confirmee")
    private LocalDate dateConfirmee;

    @Column(name = "date_visite")
    private LocalDate dateVisite;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private StatutVisite statut = StatutVisite.EN_ATTENTE;

    @Column(name = "date_envoi")
    private LocalDateTime dateEnvoi;

    @Column(name = "date_reponse")
    private LocalDateTime dateReponse;

    @Column(name = "nb_relances")
    private Integer nbRelances = 0;

    @Column(name = "date_relance")
    private LocalDateTime dateRelance;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "technicien_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "visitesTechnicien"})
    private Utilisateur technicien;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "responsable_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "visitesResponsable"})
    private Utilisateur responsable;

    @Column(columnDefinition = "TEXT")
    private String resultat;

    @Column(name = "date_realisation")
    private LocalDateTime dateRealisation;

    @OneToOne(mappedBy = "planning", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private PieceIntervention pieceIntervention;

    // ✅ AJOUTER LA RELATION AVEC LIST
    @OneToMany(mappedBy = "planning", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private List<PieceIntervention> piecesIntervention = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournee_id")
    private Tournee tournee;
}