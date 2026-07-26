// controller/EmailController.java - Version complète
package com.example.visite.controller;

import com.example.visite.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/emails")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class EmailController {

    private final EmailService emailService;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @PostMapping("/send-proposition/{planningId}")
    public ResponseEntity<Void> sendProposition(@PathVariable Integer planningId) {
        return ResponseEntity.ok().build();
    }

    @PostMapping("/send-relance/{planningId}")
    public ResponseEntity<Void> sendRelance(@PathVariable Integer planningId) {
        return ResponseEntity.ok().build();
    }

    // ✅ ENDPOINT DE TEST POUR VÉRIFIER L'ENVOI D'EMAIL
    @PostMapping("/test")
    public ResponseEntity<String> testEmail(@RequestParam String to) {
        try {
            log.info("📧 Test d'envoi d'email vers: {}", to);
            log.info("📧 De: {}", fromEmail);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("🧪 Test d'envoi d'email RMS");
            helper.setText("""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #0044CC;">RMS - Systèmes de Pointage</h2>
                    <p>Bonjour,</p>
                    <p>Ceci est un email de test pour vérifier que la configuration SMTP fonctionne correctement.</p>
                    <p style="color: #4caf50;">✅ Si vous recevez cet email, la configuration est correcte !</p>
                    <hr style="border: 1px solid #eee;">
                    <p style="color: #888; font-size: 12px;">Cordialement,<br>L'équipe RMS</p>
                </div>
            """, true);

            mailSender.send(message);
            log.info("✅ Email de test envoyé avec succès à {}", to);
            return ResponseEntity.ok("Email envoyé avec succès à " + to);

        } catch (Exception e) {
            log.error("❌ Erreur lors de l'envoi de l'email de test: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }
}