// repository/PieceInterventionRepository.java
package com.example.visite.repository;

import com.example.visite.model.PieceIntervention;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PieceInterventionRepository extends JpaRepository<PieceIntervention, Integer> {
    PieceIntervention findByPlanningId(Integer planningId);
}