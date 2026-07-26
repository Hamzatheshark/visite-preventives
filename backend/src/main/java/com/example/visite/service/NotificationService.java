// service/NotificationService.java
package com.example.visite.service;

import com.example.visite.model.Notification;
import com.example.visite.model.Utilisateur;
import java.util.List;

public interface NotificationService {

    Notification createNotification(Notification notification);

    List<Notification> getNotificationsByUser(Integer userId);

    List<Notification> getNonLuNotifications(Integer userId);

    long countNonLuNotifications(Integer userId);

    void marquerCommeLu(Integer notificationId);

    void marquerToutesCommeLues(Integer userId);

    void saveNotification(Notification notification, List<Utilisateur> destinataires);

    void notifierResponsable(Integer planningId, String message, String type);

    void notifierTechnicien(Integer planningId, String message, String type);

    void notifierAdmin(String message, String type);

    void notifierChangementStatut(Integer planningId, String ancienStatut, String nouveauStatut);

    void notifierVisiteTerminee(Integer planningId, String nomUtilisateur);

    void notifierAssignmentAnnule(Integer planningId, String type, String nomUtilisateur);
}