package com.example.visite.service;

import com.example.visite.model.Planning;

public interface EmailService {

    void sendPropositionEmail(Planning planning);

    void sendRelanceEmail(Planning planning);

    void sendEscaladeNotification(Planning planning);

    void sendConfirmationEmail(Planning planning);

    void sendPlanningPDF(Planning planning);
}