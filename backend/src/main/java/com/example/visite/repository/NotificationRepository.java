// repository/NotificationRepository.java
package com.example.visite.repository;

import com.example.visite.model.Notification;
import com.example.visite.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    List<Notification> findByUtilisateurOrderByDateCreationDesc(Utilisateur utilisateur);

    List<Notification> findByUtilisateurAndLuFalseOrderByDateCreationDesc(Utilisateur utilisateur);

    long countByUtilisateurAndLuFalse(Utilisateur utilisateur);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.lu = true WHERE n.utilisateur = :utilisateur")
    void marquerToutesCommeLues(Utilisateur utilisateur);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.lu = true WHERE n.id = :id")
    void marquerCommeLue(Integer id);

    // repository/NotificationRepository.java - Ajouter cette méthode
    @Query("SELECT n FROM Notification n ORDER BY n.dateCreation DESC")
    List<Notification> findAllByOrderByDateCreationDesc();
}