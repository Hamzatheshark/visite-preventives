package com.example.visite.repository;

import com.example.visite.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Integer> {

    Optional<Utilisateur> findByEmail(String email);

    List<Utilisateur> findByActifTrue();

    @Query("SELECT u FROM Utilisateur u WHERE u.role = :role AND u.actif = true")
    List<Utilisateur> findByRoleAndActifTrue(@Param("role") String role);

    @Query("SELECT u FROM Utilisateur u WHERE u.role = 'TECHNICIEN_HARDWARE' AND u.actif = true")
    List<Utilisateur> findTechniciensActifs();

    @Query("SELECT u FROM Utilisateur u WHERE u.role = 'RESPONSABLE_SOFTWARE' AND u.actif = true")
    List<Utilisateur> findResponsablesActifs();

    @Query("SELECT u FROM Utilisateur u WHERE u.role = 'ADMIN' AND u.actif = true")
    List<Utilisateur> findAdminsActifs();

    boolean existsByEmail(String email);
}