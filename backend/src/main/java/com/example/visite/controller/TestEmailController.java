package com.example.visite.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.web.bind.annotation.*;

import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test-email")
@RequiredArgsConstructor
@Slf4j
public class TestEmailController {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${spring.mail.enabled:false}")
    private boolean emailEnabled;

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("fromEmail", fromEmail);
        config.put("emailEnabled", emailEnabled);
        config.put("smtpHost", "smtp.gmail.com");
        config.put("smtpPort", 587);
        config.put("timestamp", LocalDateTime.now());

        log.info("📧 Configuration email: {}", config);
        return ResponseEntity.ok(config);
    }

    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendTestEmail(@RequestParam String to) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("from", fromEmail);
        response.put("to", to);
        response.put("emailEnabled", emailEnabled);

        log.info("========================================");
        log.info("🧪 TEST D'ENVOI D'EMAIL");
        log.info("========================================");
        log.info("📧 De: {}", fromEmail);
        log.info("📧 À: {}", to);
        log.info("📧 Email activé: {}", emailEnabled);

        try {
            if (!emailEnabled) {
                response.put("status", "DISABLED");
                response.put("message", "Les emails sont désactivés");
                return ResponseEntity.ok(response);
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("🧪 TEST RMS - " + LocalDateTime.now());

            String html = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; }
                        .header { background: #0044CC; color: white; padding: 15px; border-radius: 5px; }
                        .content { padding: 20px; }
                        .success { background: #e8f5e9; padding: 15px; border-radius: 5px; border-left: 4px solid #4CAF50; }
                        .info { background: #e3f2fd; padding: 10px; border-radius: 5px; margin: 10px 0; }
                        .footer { color: #888; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>📧 RMS - Test d'envoi d'email</h2>
                    </div>
                    <div class="content">
                        <div class="success">
                            <h3>✅ Configuration SMTP correcte !</h3>
                            <p>Si vous recevez cet email, les emails fonctionnent parfaitement.</p>
                        </div>
                        <div class="info">
                            <table>
                                <tr><td><strong>Date :</strong></td><td>%s</td></tr>
                                <tr><td><strong>De :</strong></td><td>%s</td></tr>
                                <tr><td><strong>À :</strong></td><td>%s</td></tr>
                            </table>
                        </div>
                    </div>
                    <div class="footer">
                        <p>RMS - Systèmes de Pointage</p>
                    </div>
                </body>
                </html>
            """.formatted(LocalDateTime.now(), fromEmail, to);

            helper.setText(html, true);

            log.info("📧 Envoi en cours...");
            mailSender.send(message);
            log.info("✅ Email envoyé avec succès à {}", to);

            response.put("status", "SUCCESS");
            response.put("message", "Email envoyé avec succès");

        } catch (jakarta.mail.AuthenticationFailedException e) {
            log.error("❌ ERREUR D'AUTHENTIFICATION GMAIL");
            log.error("   Cause: {}", e.getMessage());

            response.put("status", "AUTH_ERROR");
            response.put("message", "Erreur d'authentification SMTP");
            response.put("error", e.getMessage());
            response.put("solution", "Générez un nouveau mot de passe d'application Gmail");

        } catch (Exception e) {
            log.error("❌ ERREUR D'ENVOI:", e);
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
        }

        return ResponseEntity.ok(response);
    }
}