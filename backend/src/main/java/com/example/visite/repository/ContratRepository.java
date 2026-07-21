// repository/ContratRepository.java
package com.example.visite.repository;

import com.example.visite.model.Contrat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ContratRepository extends JpaRepository<Contrat, Integer> {
    List<Contrat> findByClientId(Integer clientId);
    List<Contrat> findByActifTrue();
    List<Contrat> findByDateFinAfter(LocalDate date);
}