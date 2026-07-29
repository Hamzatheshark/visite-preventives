package com.example.visite.repository;

import com.example.visite.model.Planning;
import com.example.visite.model.Utilisateur;
import com.example.visite.model.enums.StatutVisite;
import com.example.visite.model.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlanningRepository extends JpaRepository<Planning, Integer> {

    // ====== RECHERCHES DE BASE ======

    List<Planning> findByStatut(StatutVisite statut);

    List<Planning> findBySiteAndStatut(Site site, StatutVisite statut);

    List<Planning> findByDateVisiteBetween(LocalDate start, LocalDate end);

    Optional<Planning> findByNumVisite(Integer numVisite);


    boolean existsBySiteAndDateVisite(Site site, LocalDate date);

    // ====== RECHERCHES PAR EMAIL ======

    @Query("SELECT p FROM Planning p WHERE p.site.client.emailContact = :email OR p.site.emailContact = :email")
    List<Planning> findByClientEmail(@Param("email") String email);

    @Query("SELECT p FROM Planning p WHERE p.site.client.id = :clientId")
    List<Planning> findBySiteClientId(@Param("clientId") Integer clientId);

    // ====== RECHERCHES POUR LE SCHEDULER ======

    @Query("SELECT p FROM Planning p WHERE p.statut IN ('EN_ATTENTE', 'RELANCE') AND p.dateEnvoi <= CURRENT_DATE")
    List<Planning> findPendingVisits();

    @Query("SELECT p FROM Planning p WHERE p.statut = 'REALISE' AND p.pieceIntervention IS NULL")
    List<Planning> findVisitesWithoutPI();

    @Query("SELECT p FROM Planning p WHERE p.technicien.id = :technicienId")
    List<Planning> findByTechnicienId(@Param("technicienId") Integer technicienId);

    List<Planning> findBySite(Site site);
    // ====== RECHERCHES PAR DATE ======

    List<Planning> findByDateVisite(LocalDate date);

    List<Planning> findByDateProposeeBetween(LocalDate start, LocalDate end);

    @Query("SELECT p FROM Planning p WHERE p.dateVisite BETWEEN :start AND :end AND p.statut = :statut")
    List<Planning> findVisitesByDateAndStatut(@Param("start") LocalDate start,
                                              @Param("end") LocalDate end,
                                              @Param("statut") StatutVisite statut);

    // ====== RECHERCHES POUR LE DASHBOARD ======

    long countByStatut(StatutVisite statut);

    @Query("SELECT COUNT(p) FROM Planning p WHERE p.technicien = :technicien")
    long countByTechnicien(@Param("technicien") Utilisateur technicien);

    @Query("SELECT COUNT(p) FROM Planning p WHERE p.responsable = :responsable")
    long countByResponsable(@Param("responsable") Utilisateur responsable);

    @Query("SELECT COUNT(p) FROM Planning p WHERE p.statut = :statut AND p.site.client.id = :clientId")
    long countByStatutAndClient(@Param("statut") StatutVisite statut, @Param("clientId") Integer clientId);

    @Query("SELECT p FROM Planning p WHERE p.statut IN ('EN_ATTENTE', 'RELANCE') AND p.dateProposee < CURRENT_DATE")
    List<Planning> findLatePlannings();

    @Query("SELECT p FROM Planning p WHERE p.dateVisite BETWEEN :start AND :end")
    List<Planning> findVisitesInPeriod(@Param("start") LocalDate start, @Param("end") LocalDate end);

    List<Planning> findByContratId(Integer contratId);

    // ✅ NOUVELLE MÉTHODE - CHARGER AVEC TOUTES LES RELATIONS
    @Query("SELECT p FROM Planning p " +
            "LEFT JOIN FETCH p.technicien " +
            "LEFT JOIN FETCH p.responsable " +
            "LEFT JOIN FETCH p.site s " +
            "LEFT JOIN FETCH s.client")
    List<Planning> findAllWithDetails();

    // ✅ AJOUTER AUSSI CETTE MÉTHODE POUR UN SEUL PLANNING
    @Query("SELECT p FROM Planning p " +
            "LEFT JOIN FETCH p.technicien " +
            "LEFT JOIN FETCH p.responsable " +
            "WHERE p.id = :id")
    Optional<Planning> findByIdWithDetails(@Param("id") Integer id);

    // repository/PlanningRepository.java - Ajouter
    @Query("SELECT p FROM Planning p WHERE p.responsable IS NULL")
    List<Planning> findByResponsableIsNull();

    List<Planning> findByTechnicien(Utilisateur technicien);
    List<Planning> findByResponsable(Utilisateur responsable);
}