// service/impl/EmailServiceImpl.java
package com.example.visite.service.impl;

import com.example.visite.model.Planning;
import com.example.visite.model.Client;
import com.example.visite.model.Site;
import com.example.visite.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${spring.mail.enabled:true}")
    private boolean emailEnabled;

    @Override
    public void sendPropositionEmail(Planning planning) {
        try {
            Client client = planning.getSite().getClient();
            Site site = planning.getSite();
            String to = site.getEmailContact() != null ? site.getEmailContact() : client.getEmailContact();

            if (to == null || to.isEmpty()) {
                log.warn("⚠️ Aucun email pour le client {}, email non envoyé", client.getNom());
                return;
            }

            log.info("========================================");
            log.info("📧 ENVOI D'EMAIL");
            log.info("📧 De: {}", fromEmail);
            log.info("📧 À: {}", to);
            log.info("📧 Client: {}", client.getNom());
            log.info("📧 Site: {}", site.getNom());
            log.info("📧 Date: {}", planning.getDateProposee());
            log.info("========================================");

            if (!emailEnabled) {
                log.info("📧 EMAIL DESACTIVE - Email non envoyé");
                return;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(String.format("[RMS] Proposition de visite de maintenance - %s - %s",
                    client.getNom(), site.getNom()));

            String htmlContent = buildPropositionEmail(planning);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✅ Email envoyé avec succès à {}", to);

        } catch (Exception e) {
            log.error("❌ Erreur lors de l'envoi de l'email: {}", e.getMessage(), e);
        }
    }

    @Override
    public void sendRelanceEmail(Planning planning) {
        try {
            Client client = planning.getSite().getClient();
            Site site = planning.getSite();
            String to = site.getEmailContact() != null ? site.getEmailContact() : client.getEmailContact();

            if (to == null || to.isEmpty()) {
                log.warn("⚠️ Aucun email pour le client {}", client.getNom());
                return;
            }

            log.info("📧 RELANCE vers: {}", to);

            if (!emailEnabled) {
                log.info("📧 EMAIL DESACTIVE - Relance non envoyée");
                return;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(String.format("[RMS] Relance - Proposition de visite - %s - %s",
                    client.getNom(), site.getNom()));

            String htmlContent = buildRelanceEmail(planning);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✅ Relance envoyée à {}", to);

        } catch (Exception e) {
            log.error("❌ Erreur relance: {}", e.getMessage(), e);
        }
    }

    @Override
    public void sendEscaladeNotification(Planning planning) {
        try {
            log.warn("⚠️ ESCALADE REQUISE visite ID: {}", planning.getId());

            if (!emailEnabled) {
                log.info("📧 EMAIL DESACTIVE - Escalade non envoyée");
                return;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo("admin@rms.com");
            helper.setSubject(String.format("[URGENT] Escalade requise - Visite ID: %d", planning.getId()));

            String htmlContent = buildEscaladeEmail(planning);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✅ Escalade notifiée");

        } catch (Exception e) {
            log.error("❌ Erreur escalade: {}", e.getMessage(), e);
        }
    }

    @Override
    public void sendConfirmationEmail(Planning planning) {
        try {
            Client client = planning.getSite().getClient();
            Site site = planning.getSite();
            String to = site.getEmailContact() != null ? site.getEmailContact() : client.getEmailContact();

            if (to == null || to.isEmpty()) {
                log.warn("⚠️ Aucun email pour le client {}", client.getNom());
                return;
            }

            log.info("📧 CONFIRMATION vers: {}", to);

            if (!emailEnabled) {
                log.info("📧 EMAIL DESACTIVE - Confirmation non envoyée");
                return;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(String.format("[RMS] Confirmation de visite - %s - %s",
                    client.getNom(), site.getNom()));

            String htmlContent = buildConfirmationEmail(planning);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✅ Confirmation envoyée à {}", to);

        } catch (Exception e) {
            log.error("❌ Erreur confirmation: {}", e.getMessage(), e);
        }
    }

    @Override
    public void sendPlanningPDF(Planning planning) {
        log.info("📧 Envoi PDF planning visite {}", planning.getId());
    }

    // ===== BUILDERS D'EMAILS =====
    private String buildPropositionEmail(Planning planning) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        // Créer le token pour l'acceptation et le refus
        String acceptToken = Base64.getEncoder().encodeToString(
                (planning.getId() + ":true").getBytes()
        );
        String refuseToken = Base64.getEncoder().encodeToString(
                (planning.getId() + ":false").getBytes()
        );

        String baseUrl = "http://localhost:8080/api/emails/reponse/";

        return String.format("""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #0044CC;">RMS - Systèmes de Pointage</h2>
                <p>Bonjour,</p>
                <p>Dans le cadre de votre contrat de maintenance, nous vous proposons une visite préventive pour le site suivant :</p>
                <table style="width: 100%%; border-collapse: collapse; margin: 15px 0;">
                    <tr>
                        <td style="padding: 8px; background-color: #f2f2f2; width: 30%%;"><strong>Site</strong></td>
                        <td style="padding: 8px;">%s</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; background-color: #f2f2f2;"><strong>Adresse</strong></td>
                        <td style="padding: 8px;">%s</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; background-color: #f2f2f2;"><strong>Date proposée</strong></td>
                        <td style="padding: 8px;"><strong>%s</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; background-color: #f2f2f2;"><strong>Visite n°</strong></td>
                        <td style="padding: 8px;">%d</td>
                    </tr>
                </table>
                <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <h3 style="margin-top: 0; color: #0044CC;">Confirmez votre disponibilité</h3>
                    <div style="display: flex; justify-content: center; gap: 20px; margin-top: 15px;">
                        <a href="%s" style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            ✅ Accepter
                        </a>
                        <a href="%s" style="background: #f44336; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            ❌ Refuser
                        </a>
                    </div>
                </div>
                <p style="color: #666; font-size: 12px;">Veuillez répondre dans un délai de 7 jours.</p>
                <hr style="border: 1px solid #eee;">
                <p style="color: #888; font-size: 12px;">Cordialement,<br>L'équipe RMS</p>
            </div>
            """,
                planning.getSite().getNom(),
                planning.getSite().getAdresse() != null ? planning.getSite().getAdresse() : "Non spécifiée",
                planning.getDateProposee().format(dateFormatter),
                planning.getNumVisite(),
                baseUrl + acceptToken,
                baseUrl + refuseToken
        );
    }

    private String buildRelanceEmail(Planning planning) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return String.format("""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #0044CC;">RMS - Systèmes de Pointage</h2>
                <p><strong>RELANCE</strong> - Nous n'avons pas reçu de réponse à notre précédent email.</p>
                <p>Date proposée: <strong>%s</strong></p>
                <p>Merci de répondre par <strong>"ACCEPTE"</strong> ou <strong>"REFUSE"</strong>.</p>
                <hr style="border: 1px solid #eee;">
                <p style="color: #888; font-size: 12px;">Cordialement,<br>L'équipe RMS</p>
            </div>
            """,
                planning.getDateProposee().format(dateFormatter)
        );
    }

    private String buildEscaladeEmail(Planning planning) {
        return String.format("""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #ff0000;">⚠️ ESCALADE REQUISE</h2>
                <p><strong>Visite ID:</strong> %d</p>
                <p><strong>Client:</strong> %s</p>
                <p><strong>Site:</strong> %s</p>
                <p><strong>Date:</strong> %s</p>
                <p style="color: #ff0000;">Une intervention manuelle est nécessaire.</p>
            </div>
            """,
                planning.getId(),
                planning.getSite().getClient().getNom(),
                planning.getSite().getNom(),
                planning.getDateProposee()
        );
    }

    private String buildConfirmationEmail(Planning planning) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return String.format("""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #0044CC;">RMS - Systèmes de Pointage</h2>
                <p>Bonjour,</p>
                <p>Votre visite est <strong>confirmée</strong> pour le :</p>
                <p style="font-size: 18px; color: #0044CC;"><strong>%s</strong></p>
                <p>Site: <strong>%s</strong></p>
                <p>Adresse: %s</p>
                <hr style="border: 1px solid #eee;">
                <p style="color: #888; font-size: 12px;">Cordialement,<br>L'équipe RMS</p>
            </div>
            """,
                planning.getDateConfirmee().format(dateFormatter),
                planning.getSite().getNom(),
                planning.getSite().getAdresse() != null ? planning.getSite().getAdresse() : "Non spécifiée"
        );
    }
}