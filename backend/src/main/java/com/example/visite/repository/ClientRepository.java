package com.example.visite.repository;

import com.example.visite.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Integer> {

    List<Client> findByActifTrue();

    List<Client> findByActifFalse();

    Optional<Client> findByEmailContact(String email);

    Optional<Client> findByCode(String code);

    // ✅ AJOUTER CETTE MÉTHODE
    List<Client> findByNomContainingIgnoreCase(String nom);

    @Query("SELECT c FROM Client c WHERE c.nom LIKE %:nom%")
    List<Client> findByNomContaining(@Param("nom") String nom);

    @Query("SELECT c FROM Client c WHERE c.nbVisitesAn IS NOT NULL AND c.nbVisitesAn > 0 AND c.actif = true")
    List<Client> findClientsAvecVisitesProgrammees();

    @Query("SELECT COUNT(c) FROM Client c WHERE c.actif = true")
    long countActifs();

    @Query("SELECT c FROM Client c WHERE c.actif = true AND c.nbVisitesAn > 0")
    List<Client> findActifsAvecVisites();
}