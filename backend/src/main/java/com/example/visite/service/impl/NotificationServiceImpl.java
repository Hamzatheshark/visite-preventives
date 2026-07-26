// service/impl/NotificationServiceImpl.java
package com.example.visite.service.impl;

import com.example.visite.model.Notification;
import com.example.visite.model.Planning;
import com.example.visite.model.Utilisateur;
import com.example.visite.model.enums.RoleUtilisateur;
import com.example.visite.repository.NotificationRepository;
import com.example.visite.repository.PlanningRepository;
import com.example.visite.repository.UtilisateurRepository;
import com.example.visite.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final PlanningRepository planningRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Override
    public Notification createNotification(Notification notification) {
        notification.setDateCreation(LocalDateTime.now());
        notification.setLu(false);
        return notificationRepository.save(notification);
    }

    @Override
    public List<Notification> getNotificationsByUser(Integer userId) {
        Utilisateur user = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return notificationRepository.findByUtilisateurOrderByDateCreationDesc(user);
    }

    @Override
    public List<Notification> getNonLuNotifications(Integer userId) {
        Utilisateur user = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return notificationRepository.findByUtilisateurAndLuFalseOrderByDateCreationDesc(user);
    }

    @Override
    public long countNonLuNotifications(Integer userId) {
        Utilisateur user = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return notificationRepository.countByUtilisateurAndLuFalse(user);
    }

    @Override
    @Transactional
    public void marquerCommeLu(Integer notificationId) {
        notificationRepository.marquerCommeLue(notificationId);
    }

    @Override
    @Transactional
    public void marquerToutesCommeLues(Integer userId) {
        Utilisateur user = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        notificationRepository.marquerToutesCommeLues(user);
    }

    @Override
    @Transactional
    public void saveNotification(Notification notification, List<Utilisateur> destinataires) {
        if (destinataires == null || destinataires.isEmpty()) {
            log.warn("⚠️ Aucun destinataire pour la notification: {}", notification.getTitre());
            return;
        }

        for (Utilisateur destinataire : destinataires) {
            Notification notif = new Notification();
            notif.setTitre(notification.getTitre());
            notif.setMessage(notification.getMessage());
            notif.setType(notification.getType());
            notif.setUtilisateur(destinataire);
            notif.setPlanningId(notification.getPlanningId());
            notif.setLien(notification.getLien());
            notif.setDateCreation(LocalDateTime.now());
            notif.setLu(false);
            notificationRepository.save(notif);
        }

        log.info("📧 Notification envoyée à {} destinataire(s)", destinataires.size());
    }

    @Override
    public void notifierResponsable(Integer planningId, String message, String type) {
        try {
            Planning planning = planningRepository.findById(planningId)
                    .orElseThrow(() -> new RuntimeException("Planning non trouvé"));

            Utilisateur responsable = planning.getResponsable();
            if (responsable != null) {
                Notification notif = new Notification();
                notif.setTitre("🔔 Visite V" + planning.getNumVisite());
                notif.setMessage(message);
                notif.setType(type);
                notif.setUtilisateur(responsable);
                notif.setPlanningId(planningId);
                notif.setLien("/responsable-current");
                notif.setDateCreation(LocalDateTime.now());
                notif.setLu(false);
                notificationRepository.save(notif);
                log.info("📧 Notification envoyée au responsable {} {}", responsable.getPrenom(), responsable.getNom());
            }
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'envoi de la notification au responsable", e);
        }
    }

    @Override
    public void notifierTechnicien(Integer planningId, String message, String type) {
        try {
            Planning planning = planningRepository.findById(planningId)
                    .orElseThrow(() -> new RuntimeException("Planning non trouvé"));

            Utilisateur technicien = planning.getTechnicien();
            if (technicien != null) {
                Notification notif = new Notification();
                notif.setTitre("🔔 Visite V" + planning.getNumVisite());
                notif.setMessage(message);
                notif.setType(type);
                notif.setUtilisateur(technicien);
                notif.setPlanningId(planningId);
                notif.setLien("/technicien-current");
                notif.setDateCreation(LocalDateTime.now());
                notif.setLu(false);
                notificationRepository.save(notif);
                log.info("📧 Notification envoyée au technicien {} {}", technicien.getPrenom(), technicien.getNom());
            }
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'envoi de la notification au technicien", e);
        }
    }

    @Override
    public void notifierAdmin(String message, String type) {
        try {
            List<Utilisateur> admins = utilisateurRepository.findByRole(RoleUtilisateur.ADMIN);

            for (Utilisateur admin : admins) {
                Notification notif = new Notification();
                notif.setTitre("🔔 Notification Admin");
                notif.setMessage(message);
                notif.setType(type);
                notif.setUtilisateur(admin);
                notif.setLien("/dashboard");
                notif.setDateCreation(LocalDateTime.now());
                notif.setLu(false);
                notificationRepository.save(notif);
            }
            log.info("📧 Notification envoyée à {} admin(s)", admins.size());
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'envoi de la notification aux admins", e);
        }
    }

    @Override
    public void notifierChangementStatut(Integer planningId, String ancienStatut, String nouveauStatut) {
        try {
            Planning planning = planningRepository.findById(planningId)
                    .orElseThrow(() -> new RuntimeException("Planning non trouvé"));

            String message = String.format(
                    "La visite V%d du client %s a changé de statut : %s -> %s",
                    planning.getNumVisite(),
                    planning.getSite().getClient().getNom(),
                    ancienStatut,
                    nouveauStatut
            );

            // Notifier le responsable
            if (planning.getResponsable() != null) {
                notifierResponsable(planningId, message, "STATUT_CHANGEMENT");
            }

            // Notifier le technicien
            if (planning.getTechnicien() != null) {
                notifierTechnicien(planningId, message, "STATUT_CHANGEMENT");
            }

            // Notifier les admins
            notifierAdmin(message, "STATUT_CHANGEMENT");

        } catch (Exception e) {
            log.error("❌ Erreur lors de la notification de changement de statut", e);
        }
    }

    @Override
    public void notifierVisiteTerminee(Integer planningId, String nomUtilisateur) {
        try {
            Planning planning = planningRepository.findById(planningId)
                    .orElseThrow(() -> new RuntimeException("Planning non trouvé"));

            String message = String.format(
                    "✅ La visite V%d du client %s a été terminée par %s",
                    planning.getNumVisite(),
                    planning.getSite().getClient().getNom(),
                    nomUtilisateur
            );

            // Notifier le responsable
            if (planning.getResponsable() != null) {
                notifierResponsable(planningId, message, "VISITE_TERMINEE");
            }

            // Notifier le technicien
            if (planning.getTechnicien() != null) {
                notifierTechnicien(planningId, message, "VISITE_TERMINEE");
            }

            // Notifier les admins
            notifierAdmin(message, "VISITE_TERMINEE");

        } catch (Exception e) {
            log.error("❌ Erreur lors de la notification de visite terminée", e);
        }
    }

    @Override
    public void notifierAssignmentAnnule(Integer planningId, String type, String nomUtilisateur) {
        try {
            Planning planning = planningRepository.findById(planningId)
                    .orElseThrow(() -> new RuntimeException("Planning non trouvé"));

            String message = String.format(
                    "❌ L'assignement du %s %s a été annulé pour la visite V%d",
                    type.equals("RESPONSABLE") ? "responsable" : "technicien",
                    nomUtilisateur,
                    planning.getNumVisite()
            );

            // Notifier les admins
            notifierAdmin(message, type + "_ANNULE");

            // Notifier l'autre personne si présente
            if (type.equals("RESPONSABLE") && planning.getTechnicien() != null) {
                notifierTechnicien(planningId, message, type + "_ANNULE");
            } else if (type.equals("TECHNICIEN") && planning.getResponsable() != null) {
                notifierResponsable(planningId, message, type + "_ANNULE");
            }

        } catch (Exception e) {
            log.error("❌ Erreur lors de la notification d'annulation d'assignement", e);
        }
    }
}