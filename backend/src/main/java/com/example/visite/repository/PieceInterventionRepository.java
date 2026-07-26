// repository/PieceInterventionRepository.java
package com.example.visite.repository;

import com.example.visite.model.PieceIntervention;
import com.example.visite.model.Planning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PieceInterventionRepository extends JpaRepository<PieceIntervention, Integer> {

    /**
     * Récupérer toutes les pièces d'une visite (planning)
     */
    List<PieceIntervention> findByPlanning(Planning planning);

    /**
     * Récupérer toutes les pièces d'une visite par l'ID du planning
     */
    @Query("SELECT p FROM PieceIntervention p WHERE p.planning.id = :planningId")
    List<PieceIntervention> findByPlanningId(@Param("planningId") Integer planningId);

    /**
     * Vérifier si une visite a des pièces jointes
     */
    boolean existsByPlanning(Planning planning);

    /**
     * Vérifier si une visite a des pièces jointes par l'ID du planning
     */
    @Query("SELECT COUNT(p) > 0 FROM PieceIntervention p WHERE p.planning.id = :planningId")
    boolean existsByPlanningId(@Param("planningId") Integer planningId);

    /**
     * Compter le nombre de pièces pour une visite
     */
    long countByPlanning(Planning planning);

    /**
     * Compter le nombre de pièces pour une visite par l'ID du planning
     */
    @Query("SELECT COUNT(p) FROM PieceIntervention p WHERE p.planning.id = :planningId")
    long countByPlanningId(@Param("planningId") Integer planningId);

    /**
     * Récupérer toutes les pièces d'un client spécifique
     */
    @Query("SELECT p FROM PieceIntervention p WHERE p.planning.site.client.id = :clientId")
    List<PieceIntervention> findByClientId(@Param("clientId") Integer clientId);

    /**
     * Récupérer les pièces par type de fichier
     */
    List<PieceIntervention> findByTypeFichier(String typeFichier);

    /**
     * Récupérer les pièces par nom de fichier (recherche partielle)
     */
    @Query("SELECT p FROM PieceIntervention p WHERE LOWER(p.nomFichier) LIKE LOWER(CONCAT('%', :nom, '%'))")
    List<PieceIntervention> findByNomFichierContaining(@Param("nom") String nom);

    /**
     * Récupérer les pièces uploadées après une date donnée
     */
    @Query("SELECT p FROM PieceIntervention p WHERE p.dateUpload >= :date")
    List<PieceIntervention> findByDateUploadAfter(@Param("date") java.time.LocalDateTime date);

    /**
     * Récupérer les pièces uploadées entre deux dates
     */
    @Query("SELECT p FROM PieceIntervention p WHERE p.dateUpload BETWEEN :startDate AND :endDate")
    List<PieceIntervention> findByDateUploadBetween(
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate);

    /**
     * Récupérer une pièce avec son planning en une seule requête (optimisation)
     */
    @Query("SELECT p FROM PieceIntervention p JOIN FETCH p.planning WHERE p.id = :id")
    Optional<PieceIntervention> findByIdWithPlanning(@Param("id") Integer id);

    /**
     * Récupérer toutes les pièces avec leurs plannings (optimisation)
     */
    @Query("SELECT p FROM PieceIntervention p JOIN FETCH p.planning")
    List<PieceIntervention> findAllWithPlanning();

    /**
     * Récupérer les pièces par planning avec tri par date décroissante
     */
    @Query("SELECT p FROM PieceIntervention p WHERE p.planning.id = :planningId ORDER BY p.dateUpload DESC")
    List<PieceIntervention> findByPlanningIdOrderByDateDesc(@Param("planningId") Integer planningId);

    /**
     * Supprimer toutes les pièces d'une visite
     */
    void deleteByPlanning(Planning planning);

    /**
     * Supprimer toutes les pièces d'une visite par l'ID du planning
     */
    @Query("DELETE FROM PieceIntervention p WHERE p.planning.id = :planningId")
    void deleteByPlanningId(@Param("planningId") Integer planningId);
}