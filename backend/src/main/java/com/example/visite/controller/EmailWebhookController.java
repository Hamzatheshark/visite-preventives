package com.example.visite.controller;

import com.example.visite.service.PlanningService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;

@RestController
@RequestMapping("/api/emails")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class EmailWebhookController {

    private final PlanningService planningService;

    @GetMapping("/reponse/{token}")
    public ResponseEntity<String> traiterReponseEmail(@PathVariable String token) {
        log.info("========================================");
        log.info("📧 TRAITEMENT DE LA RÉPONSE CLIENT");
        log.info("========================================");
        log.info("📧 Token reçu: '{}'", token);
        log.info("📧 Longueur du token: {}", token != null ? token.length() : 0);

        try {
            // ✅ 1. Vérifier que le token n'est pas vide
            if (token == null || token.trim().isEmpty()) {
                log.error("❌ Token vide ou null");
                return ResponseEntity.badRequest()
                        .header("Content-Type", "text/html;charset=UTF-8")
                        .body(buildErrorHtmlResponse("Token invalide ou manquant"));
            }

            // ✅ 2. Nettoyer le token (supprimer les espaces et caractères invisibles)
            String cleanToken = token.trim().replaceAll("\\s+", "");
            log.info("📧 Token nettoyé: '{}'", cleanToken);

            // ✅ 3. Décoder le token (support URL-safe + standard)
            String decoded = null;
            try {
                // Essayer d'abord avec URL-safe decoder (pour les tokens de l'email)
                try {
                    decoded = new String(Base64.getUrlDecoder().decode(cleanToken));
                    log.info("📧 Décodé avec URL-safe decoder: '{}'", decoded);
                } catch (IllegalArgumentException e) {
                    // Si ça échoue, essayer avec le decoder standard
                    log.warn("⚠️ Échec du décodage URL-safe, tentative avec le decoder standard");
                    decoded = new String(Base64.getDecoder().decode(cleanToken));
                    log.info("📧 Décodé avec decoder standard: '{}'", decoded);
                }
            } catch (IllegalArgumentException e) {
                log.error("❌ Erreur de décodage Base64: {}", e.getMessage());
                return ResponseEntity.badRequest()
                        .header("Content-Type", "text/html;charset=UTF-8")
                        .body(buildErrorHtmlResponse("Token invalide (format Base64 incorrect)"));
            }

            // ✅ 4. Extraire les informations du token
            String[] parts = decoded.split(":");
            if (parts.length != 2) {
                log.error("❌ Format du token invalide. Attendu: 'id:boolean', Reçu: '{}'", decoded);
                return ResponseEntity.badRequest()
                        .header("Content-Type", "text/html;charset=UTF-8")
                        .body(buildErrorHtmlResponse("Format de token invalide"));
            }

            Integer planningId;
            boolean accepte;

            try {
                planningId = Integer.parseInt(parts[0].trim());
                accepte = Boolean.parseBoolean(parts[1].trim());
                log.info("📧 Planning ID: {}", planningId);
                log.info("📧 Réponse: {}", accepte ? "ACCEPTE ✅" : "REFUSE ❌");
            } catch (NumberFormatException e) {
                log.error("❌ ID de planning invalide: '{}'", parts[0]);
                return ResponseEntity.badRequest()
                        .header("Content-Type", "text/html;charset=UTF-8")
                        .body(buildErrorHtmlResponse("ID de visite invalide: " + parts[0]));
            }

            // ✅ 5. Vérifier que le planning existe
            try {
                planningService.getPlanningById(planningId);
                log.info("✅ Planning trouvé: ID {}", planningId);
            } catch (Exception e) {
                log.error("❌ Planning non trouvé: {}", planningId);
                return ResponseEntity.badRequest()
                        .header("Content-Type", "text/html;charset=UTF-8")
                        .body(buildErrorHtmlResponse("Visite non trouvée (ID: " + planningId + ")"));
            }

            // ✅ 6. Traiter la réponse
            log.info("📧 Traitement de la réponse pour la visite ID: {}", planningId);
            planningService.traiterReponseClient(planningId, accepte);
            log.info("✅ Réponse traitée avec succès pour la visite {}", planningId);

            // ✅ 7. Retourner la page HTML de confirmation
            String htmlResponse = buildHtmlResponse(accepte);
            return ResponseEntity.ok()
                    .header("Content-Type", "text/html;charset=UTF-8")
                    .body(htmlResponse);

        } catch (Exception e) {
            log.error("❌ Erreur lors du traitement de la réponse: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .header("Content-Type", "text/html;charset=UTF-8")
                    .body(buildErrorHtmlResponse("Erreur interne: " + e.getMessage()));
        }
    }

    private String buildHtmlResponse(boolean accepte) {
        // ... votre code existant (inchangé) ...
        // Je garde le même code que vous aviez
        if (accepte) {
            return "<!DOCTYPE html>\n" +
                    "<html lang=\"fr\">\n" +
                    "<head>\n" +
                    "    <meta charset=\"UTF-8\">\n" +
                    "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                    "    <title>RMS - Confirmation</title>\n" +
                    "    <style>\n" +
                    "        * { margin: 0; padding: 0; box-sizing: border-box; }\n" +
                    "        body {\n" +
                    "            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;\n" +
                    "            background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);\n" +
                    "            min-height: 100vh;\n" +
                    "            display: flex;\n" +
                    "            justify-content: center;\n" +
                    "            align-items: center;\n" +
                    "            padding: 20px;\n" +
                    "        }\n" +
                    "        .container {\n" +
                    "            background: white;\n" +
                    "            border-radius: 20px;\n" +
                    "            box-shadow: 0 20px 60px rgba(0,0,0,0.15);\n" +
                    "            max-width: 500px;\n" +
                    "            width: 100%;\n" +
                    "            padding: 50px 40px;\n" +
                    "            text-align: center;\n" +
                    "            animation: fadeIn 0.6s ease;\n" +
                    "        }\n" +
                    "        @keyframes fadeIn {\n" +
                    "            from { opacity: 0; transform: translateY(30px); }\n" +
                    "            to { opacity: 1; transform: translateY(0); }\n" +
                    "        }\n" +
                    "        .icon {\n" +
                    "            width: 100px;\n" +
                    "            height: 100px;\n" +
                    "            background: linear-gradient(135deg, #43a047, #2e7d32);\n" +
                    "            border-radius: 50%;\n" +
                    "            display: flex;\n" +
                    "            align-items: center;\n" +
                    "            justify-content: center;\n" +
                    "            margin: 0 auto 25px;\n" +
                    "            animation: bounce 0.8s ease;\n" +
                    "        }\n" +
                    "        @keyframes bounce {\n" +
                    "            0% { transform: scale(0); }\n" +
                    "            50% { transform: scale(1.15); }\n" +
                    "            70% { transform: scale(0.95); }\n" +
                    "            100% { transform: scale(1); }\n" +
                    "        }\n" +
                    "        .icon .checkmark {\n" +
                    "            color: white;\n" +
                    "            font-size: 45px;\n" +
                    "            line-height: 1;\n" +
                    "        }\n" +
                    "        h1 {\n" +
                    "            color: #1b5e20;\n" +
                    "            font-size: 28px;\n" +
                    "            margin-bottom: 12px;\n" +
                    "            font-weight: 700;\n" +
                    "        }\n" +
                    "        .subtitle {\n" +
                    "            color: #2e7d32;\n" +
                    "            font-size: 16px;\n" +
                    "            margin-bottom: 8px;\n" +
                    "        }\n" +
                    "        .message {\n" +
                    "            color: #555;\n" +
                    "            font-size: 15px;\n" +
                    "            line-height: 1.6;\n" +
                    "            margin: 20px 0 30px;\n" +
                    "            padding: 0 10px;\n" +
                    "        }\n" +
                    "        .divider {\n" +
                    "            width: 60px;\n" +
                    "            height: 3px;\n" +
                    "            background: linear-gradient(90deg, #43a047, #66bb6a);\n" +
                    "            border-radius: 3px;\n" +
                    "            margin: 0 auto 25px;\n" +
                    "        }\n" +
                    "        .footer {\n" +
                    "            color: #999;\n" +
                    "            font-size: 13px;\n" +
                    "            margin-top: 10px;\n" +
                    "            border-top: 1px solid #eee;\n" +
                    "            padding-top: 20px;\n" +
                    "        }\n" +
                    "        .footer strong {\n" +
                    "            color: #2e7d32;\n" +
                    "        }\n" +
                    "        .btn-home {\n" +
                    "            display: inline-block;\n" +
                    "            background: #2e7d32;\n" +
                    "            color: white;\n" +
                    "            padding: 12px 35px;\n" +
                    "            border-radius: 50px;\n" +
                    "            text-decoration: none;\n" +
                    "            font-weight: 600;\n" +
                    "            font-size: 15px;\n" +
                    "            transition: background 0.3s ease;\n" +
                    "            margin-top: 5px;\n" +
                    "        }\n" +
                    "        .btn-home:hover {\n" +
                    "            background: #1b5e20;\n" +
                    "        }\n" +
                    "    </style>\n" +
                    "</head>\n" +
                    "<body>\n" +
                    "    <div class=\"container\">\n" +
                    "        <div class=\"icon\">\n" +
                    "            <span class=\"checkmark\">✓</span>\n" +
                    "        </div>\n" +
                    "        <h1>Visite confirmée !</h1>\n" +
                    "        <p class=\"subtitle\">✅ Votre réponse a bien été enregistrée</p>\n" +
                    "        <div class=\"divider\"></div>\n" +
                    "        <p class=\"message\">\n" +
                    "            Merci d'avoir confirmé votre disponibilité.<br>\n" +
                    "            Notre équipe vous contactera prochainement pour organiser la visite.\n" +
                    "        </p>\n" +
                    "        <a href=\"https://rms.ma\" class=\"btn-home\">Retour au site</a>\n" +
                    "        <div class=\"footer\">\n" +
                    "            <strong>RMS</strong> &mdash; Systèmes de Pointage<br>\n" +
                    "            <span style=\"font-size: 12px; color: #bbb;\">&copy; 2026 Tous droits réservés</span>\n" +
                    "        </div>\n" +
                    "    </div>\n" +
                    "</body>\n" +
                    "</html>";
        } else {
            return "<!DOCTYPE html>\n" +
                    "<html lang=\"fr\">\n" +
                    "<head>\n" +
                    "    <meta charset=\"UTF-8\">\n" +
                    "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                    "    <title>RMS - Confirmation</title>\n" +
                    "    <style>\n" +
                    "        * { margin: 0; padding: 0; box-sizing: border-box; }\n" +
                    "        body {\n" +
                    "            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;\n" +
                    "            background: linear-gradient(135deg, #fbe9e7 0%, #ffcdd2 100%);\n" +
                    "            min-height: 100vh;\n" +
                    "            display: flex;\n" +
                    "            justify-content: center;\n" +
                    "            align-items: center;\n" +
                    "            padding: 20px;\n" +
                    "        }\n" +
                    "        .container {\n" +
                    "            background: white;\n" +
                    "            border-radius: 20px;\n" +
                    "            box-shadow: 0 20px 60px rgba(0,0,0,0.15);\n" +
                    "            max-width: 500px;\n" +
                    "            width: 100%;\n" +
                    "            padding: 50px 40px;\n" +
                    "            text-align: center;\n" +
                    "            animation: fadeIn 0.6s ease;\n" +
                    "        }\n" +
                    "        @keyframes fadeIn {\n" +
                    "            from { opacity: 0; transform: translateY(30px); }\n" +
                    "            to { opacity: 1; transform: translateY(0); }\n" +
                    "        }\n" +
                    "        .icon {\n" +
                    "            width: 100px;\n" +
                    "            height: 100px;\n" +
                    "            background: linear-gradient(135deg, #e53935, #c62828);\n" +
                    "            border-radius: 50%;\n" +
                    "            display: flex;\n" +
                    "            align-items: center;\n" +
                    "            justify-content: center;\n" +
                    "            margin: 0 auto 25px;\n" +
                    "            animation: bounce 0.8s ease;\n" +
                    "        }\n" +
                    "        @keyframes bounce {\n" +
                    "            0% { transform: scale(0); }\n" +
                    "            50% { transform: scale(1.15); }\n" +
                    "            70% { transform: scale(0.95); }\n" +
                    "            100% { transform: scale(1); }\n" +
                    "        }\n" +
                    "        .icon .cross {\n" +
                    "            color: white;\n" +
                    "            font-size: 45px;\n" +
                    "            line-height: 1;\n" +
                    "        }\n" +
                    "        h1 {\n" +
                    "            color: #b71c1c;\n" +
                    "            font-size: 28px;\n" +
                    "            margin-bottom: 12px;\n" +
                    "            font-weight: 700;\n" +
                    "        }\n" +
                    "        .subtitle {\n" +
                    "            color: #c62828;\n" +
                    "            font-size: 16px;\n" +
                    "            margin-bottom: 8px;\n" +
                    "        }\n" +
                    "        .message {\n" +
                    "            color: #555;\n" +
                    "            font-size: 15px;\n" +
                    "            line-height: 1.6;\n" +
                    "            margin: 20px 0 30px;\n" +
                    "            padding: 0 10px;\n" +
                    "        }\n" +
                    "        .divider {\n" +
                    "            width: 60px;\n" +
                    "            height: 3px;\n" +
                    "            background: linear-gradient(90deg, #e53935, #ef5350);\n" +
                    "            border-radius: 3px;\n" +
                    "            margin: 0 auto 25px;\n" +
                    "        }\n" +
                    "        .footer {\n" +
                    "            color: #999;\n" +
                    "            font-size: 13px;\n" +
                    "            margin-top: 10px;\n" +
                    "            border-top: 1px solid #eee;\n" +
                    "            padding-top: 20px;\n" +
                    "        }\n" +
                    "        .footer strong {\n" +
                    "            color: #c62828;\n" +
                    "        }\n" +
                    "        .btn-home {\n" +
                    "            display: inline-block;\n" +
                    "            background: #c62828;\n" +
                    "            color: white;\n" +
                    "            padding: 12px 35px;\n" +
                    "            border-radius: 50px;\n" +
                    "            text-decoration: none;\n" +
                    "            font-weight: 600;\n" +
                    "            font-size: 15px;\n" +
                    "            transition: background 0.3s ease;\n" +
                    "            margin-top: 5px;\n" +
                    "        }\n" +
                    "        .btn-home:hover {\n" +
                    "            background: #b71c1c;\n" +
                    "        }\n" +
                    "    </style>\n" +
                    "</head>\n" +
                    "<body>\n" +
                    "    <div class=\"container\">\n" +
                    "        <div class=\"icon\">\n" +
                    "            <span class=\"cross\">✕</span>\n" +
                    "        </div>\n" +
                    "        <h1>Visite refusée</h1>\n" +
                    "        <p class=\"subtitle\">❌ Votre réponse a bien été enregistrée</p>\n" +
                    "        <div class=\"divider\"></div>\n" +
                    "        <p class=\"message\">\n" +
                    "            Nous avons bien pris en compte votre refus.<br>\n" +
                    "            Une nouvelle proposition de date vous sera envoyée prochainement.\n" +
                    "        </p>\n" +
                    "        <a href=\"https://rms.ma\" class=\"btn-home\">Retour au site</a>\n" +
                    "        <div class=\"footer\">\n" +
                    "            <strong>RMS</strong> &mdash; Systèmes de Pointage<br>\n" +
                    "            <span style=\"font-size: 12px; color: #bbb;\">&copy; 2026 Tous droits réservés</span>\n" +
                    "        </div>\n" +
                    "    </div>\n" +
                    "</body>\n" +
                    "</html>";
        }
    }

    private String buildErrorHtmlResponse(String error) {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"fr\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>RMS - Erreur</title>\n" +
                "    <style>\n" +
                "        * { margin: 0; padding: 0; box-sizing: border-box; }\n" +
                "        body {\n" +
                "            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;\n" +
                "            background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);\n" +
                "            min-height: 100vh;\n" +
                "            display: flex;\n" +
                "            justify-content: center;\n" +
                "            align-items: center;\n" +
                "            padding: 20px;\n" +
                "        }\n" +
                "        .container {\n" +
                "            background: white;\n" +
                "            border-radius: 20px;\n" +
                "            box-shadow: 0 20px 60px rgba(0,0,0,0.15);\n" +
                "            max-width: 500px;\n" +
                "            width: 100%;\n" +
                "            padding: 50px 40px;\n" +
                "            text-align: center;\n" +
                "            animation: fadeIn 0.6s ease;\n" +
                "        }\n" +
                "        @keyframes fadeIn {\n" +
                "            from { opacity: 0; transform: translateY(30px); }\n" +
                "            to { opacity: 1; transform: translateY(0); }\n" +
                "        }\n" +
                "        .icon {\n" +
                "            width: 100px;\n" +
                "            height: 100px;\n" +
                "            background: linear-gradient(135deg, #f57c00, #ef6c00);\n" +
                "            border-radius: 50%;\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            justify-content: center;\n" +
                "            margin: 0 auto 25px;\n" +
                "        }\n" +
                "        .icon span { color: white; font-size: 45px; }\n" +
                "        h1 { color: #e65100; font-size: 28px; margin-bottom: 12px; }\n" +
                "        .message { color: #555; font-size: 15px; line-height: 1.6; margin: 20px 0; }\n" +
                "        .footer { color: #999; font-size: 13px; margin-top: 10px; border-top: 1px solid #eee; padding-top: 20px; }\n" +
                "        .btn-home {\n" +
                "            display: inline-block;\n" +
                "            background: #e65100;\n" +
                "            color: white;\n" +
                "            padding: 12px 35px;\n" +
                "            border-radius: 50px;\n" +
                "            text-decoration: none;\n" +
                "            font-weight: 600;\n" +
                "            font-size: 15px;\n" +
                "            transition: background 0.3s ease;\n" +
                "            margin-top: 5px;\n" +
                "        }\n" +
                "        .btn-home:hover { background: #bf360c; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"container\">\n" +
                "        <div class=\"icon\"><span>⚠</span></div>\n" +
                "        <h1>Une erreur est survenue</h1>\n" +
                "        <p class=\"message\">" + error + "</p>\n" +
                "        <a href=\"https://rms.ma\" class=\"btn-home\">Retour au site</a>\n" +
                "        <div class=\"footer\">\n" +
                "            <strong>RMS</strong> &mdash; Systèmes de Pointage<br>\n" +
                "            <span style=\"font-size: 12px; color: #bbb;\">&copy; 2026 Tous droits réservés</span>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }
}