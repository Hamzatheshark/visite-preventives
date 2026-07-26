// repository/ContratRepository.java - Version minimale
package com.example.visite.repository;

import com.example.visite.model.Contrat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContratRepository extends JpaRepository<Contrat, Integer> {

    List<Contrat> findByClientId(Integer clientId);

    // ✅ AJOUTER CETTE MÉTHODE
    List<Contrat> findByClientIdAndActifTrue(Integer clientId);

    List<Contrat> findByActifTrue();
}