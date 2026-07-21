package com.example.visite.service;

import com.example.visite.model.Planning;

import java.util.List;

public interface PlanningAutomatiqueService {

    /**
     * Planifier les visites pour un client spécifique
     * Les numéros de visite sont générés automatiquement par client (V1, V2, V3, V4)
     */
    List<Planning> planifierVisitesPourClient(Integer clientId);

    /**
     * Planifier les visites pour tous les clients actifs
     */
    int planifierVisitesPourTousLesClients();

    /**
     * Traiter la réponse d'un client (Accepté ou Refusé)
     */
    boolean traiterReponseClient(Integer planningId, boolean accepte);

    /**
     * Générer les visites pour une année donnée
     */
    int genererVisitesPourAnnee(int annee);

    /**
     * Générer les visites annuelles (méthode alternative)
     */
    default String genererVisitesAnnuelles() {
        int count = planifierVisitesPourTousLesClients();
        return "Génération terminée. " + count + " visites créées.";
    }

    /**
     * Trouver les plannings en attente de réponse
     */
    List<Planning> findPlanningsEnAttente();

    /**
     * Envoyer des relances pour les visites en attente
     */
    int envoyerRelances();

    /**
     * Vérifier et mettre à jour les statuts des visites
     */
    void verifierEtMettreAJourStatuts();

    /**
     * Assigner un technicien automatiquement
     */
    Planning assignerTechnicienAutomatiquement(Integer planningId);

    /**
     * Envoyer la proposition par email
     */
    void envoyerProposition(Integer planningId);

    /**
     * Vérifier les relances à envoyer
     */
    void verifierRelances();

    /**
     * Méthode pour la planification automatique (alias)
     */
    default void planifierAutomatiquement() {
        planifierVisitesPourTousLesClients();
    }
}