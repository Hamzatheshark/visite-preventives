package com.example.visite.service.impl;

import com.example.visite.model.Planning;
import com.example.visite.model.enums.StatutVisite;
import com.example.visite.repository.PlanningRepository;
import com.example.visite.service.EmailInboxService;
import com.example.visite.service.PlanningAutomatiqueService;
import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailInboxServiceImpl implements EmailInboxService {

    private final PlanningRepository planningRepository;
    private final PlanningAutomatiqueService planningAutomatiqueService;

    @Value("${spring.mail.username}")
    private String emailUsername;

    @Value("${spring.mail.password}")
    private String emailPassword;

    @Value("${spring.mail.imap.host:imap.gmail.com}")
    private String imapHost;

    @Value("${spring.mail.imap.port:993}")
    private int imapPort;

    @Value("${spring.mail.imap.folder:INBOX}")
    private String imapFolder;

    @Value("${spring.mail.inbox.enabled:false}")
    private boolean inboxEnabled;

    @Override
    @Scheduled(fixedDelay = 30000)
    @Transactional
    public void checkIncomingEmails() {
        if (!inboxEnabled) {
            log.debug("📧 Lecture des emails désactivée");
            return;
        }

        log.info("📧 Vérification des emails entrants...");

        try {
            Properties props = new Properties();
            props.put("mail.imap.host", imapHost);
            props.put("mail.imap.port", imapPort);
            props.put("mail.imap.ssl.enable", true);
            props.put("mail.imap.timeout", 10000);

            Session session = Session.getInstance(props);
            Store store = session.getStore("imap");
            store.connect(emailUsername, emailPassword);

            Folder inbox = store.getFolder(imapFolder);
            inbox.open(Folder.READ_WRITE);

            Message[] messages = inbox.getMessages();
            int processedCount = 0;

            // Limiter à 10 emails pour éviter la surcharge
            int maxMessages = Math.min(messages.length, 10);

            for (int i = messages.length - 1; i >= Math.max(0, messages.length - maxMessages); i--) {
                Message message = messages[i];

                if (!message.isSet(Flags.Flag.SEEN)) {
                    boolean processed = processEmail(message);
                    if (processed) {
                        message.setFlag(Flags.Flag.SEEN, true);
                        processedCount++;
                    }
                }
            }

            inbox.close(false);
            store.close();

            if (processedCount > 0) {
                log.info("📧 {} email(s) traités", processedCount);
            }

        } catch (Exception e) {
            log.error("❌ Erreur lors de la lecture des emails: {}", e.getMessage(), e);
        }
    }

    private boolean processEmail(Message message) {
        try {
            String from = InternetAddress.toString(message.getFrom());
            String subject = message.getSubject();
            String content = getTextFromMessage(message);

            log.info("📧 Email reçu de: {}", from);
            if (subject != null) {
                log.info("📧 Sujet: {}", subject);
            }

            if (content == null || content.isEmpty()) {
                log.warn("⚠️ Contenu de l'email vide");
                return false;
            }

            String upperContent = content.toUpperCase();

            // ✅ Détection de la réponse
            boolean accepte = upperContent.contains("ACCEPTE") ||
                    upperContent.contains("ACCEPT") ||
                    upperContent.contains("OUI") ||
                    upperContent.contains("YES") ||
                    upperContent.contains("CONFIRME") ||
                    upperContent.contains("CONFIRM") ||
                    upperContent.contains("VALIDÉ") ||
                    upperContent.contains("VALIDE") ||
                    upperContent.contains("OK") ||
                    upperContent.contains("D'ACCORD") ||
                    upperContent.contains("D ACCORD");

            boolean refuse = upperContent.contains("REFUSE") ||
                    upperContent.contains("REFUS") ||
                    upperContent.contains("NON") ||
                    upperContent.contains("NO") ||
                    upperContent.contains("ANNULE") ||
                    upperContent.contains("CANCEL") ||
                    upperContent.contains("PAS DISPONIBLE") ||
                    upperContent.contains("INDISPONIBLE");

            // Vérifier aussi dans le sujet
            String upperSubject = subject != null ? subject.toUpperCase() : "";
            if (!accepte && !refuse) {
                accepte = upperSubject.contains("ACCEPTE") ||
                        upperSubject.contains("OUI") ||
                        upperSubject.contains("CONFIRM") ||
                        upperSubject.contains("OK");
                refuse = upperSubject.contains("REFUSE") ||
                        upperSubject.contains("NON") ||
                        upperSubject.contains("ANNULE") ||
                        upperSubject.contains("CANCEL");
            }

            if (!accepte && !refuse) {
                log.debug("📧 Email ignoré - Pas de réponse détectée");
                return false;
            }

            log.info("📝 Réponse détectée: {}", accepte ? "ACCEPTE" : "REFUSE");

            // ✅ Recherche du planning
            String cleanEmail = extractEmail(from);
            log.info("🔍 Recherche planning pour email: {}", cleanEmail);

            Planning planning = null;

            // Méthode 1: Par email du client
            List<Planning> plannings = planningRepository.findByClientEmail(cleanEmail);
            if (!plannings.isEmpty()) {
                // Chercher d'abord un planning en attente
                for (Planning p : plannings) {
                    if (p.getStatut() == StatutVisite.EN_ATTENTE ||
                            p.getStatut() == StatutVisite.RELANCE) {
                        planning = p;
                        log.info("✅ Planning trouvé par email (EN_ATTENTE): ID={}", p.getId());
                        break;
                    }
                }
                if (planning == null) {
                    planning = plannings.get(0);
                    log.info("✅ Planning trouvé par email: ID={}", planning.getId());
                }
            }

            // Méthode 2: Par numéro de visite dans le sujet
            if (planning == null && subject != null) {
                String numVisite = extraireNumeroVisite(subject);
                if (numVisite != null) {
                    try {
                        Integer id = Integer.parseInt(numVisite);
                        planning = planningRepository.findById(id).orElse(null);
                        if (planning != null) {
                            log.info("✅ Planning trouvé par numéro dans sujet: ID={}", id);
                        }
                    } catch (NumberFormatException ignored) {}
                }
            }

            // Méthode 3: Par numéro de visite dans le contenu
            if (planning == null && content != null) {
                String numVisite = extraireNumeroVisite(content);
                if (numVisite != null) {
                    try {
                        Integer id = Integer.parseInt(numVisite);
                        planning = planningRepository.findById(id).orElse(null);
                        if (planning != null) {
                            log.info("✅ Planning trouvé par numéro dans contenu: ID={}", id);
                        }
                    } catch (NumberFormatException ignored) {}
                }
            }

            if (planning == null) {
                log.warn("⚠️ Aucun planning trouvé pour cet email");
                return false;
            }

            // ✅ Vérifier que le planning n'a pas déjà été traité
            if (planning.getStatut() == StatutVisite.ACCEPTE ||
                    planning.getStatut() == StatutVisite.REFUSE ||
                    planning.getStatut() == StatutVisite.REALISE) {
                log.warn("⚠️ La visite {} a déjà été traitée. Statut: {}",
                        planning.getNumVisite(), planning.getStatut());
                return false;
            }

            // ✅ Traiter la réponse
            boolean result = planningAutomatiqueService.traiterReponseClient(planning.getId(), accepte);

            if (result) {
                log.info("✅ Réponse client traitée avec succès pour la visite {}", planning.getNumVisite());
                return true;
            } else {
                log.warn("⚠️ Échec du traitement de la réponse pour la visite {}", planning.getNumVisite());
                return false;
            }

        } catch (Exception e) {
            log.error("❌ Erreur lors du traitement de l'email: {}", e.getMessage(), e);
            return false;
        }
    }

    private String getTextFromMessage(Message message) throws Exception {
        if (message.isMimeType("text/plain")) {
            Object content = message.getContent();
            return content != null ? content.toString() : "";
        } else if (message.isMimeType("text/html")) {
            String html = message.getContent().toString();
            return html.replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").trim();
        } else if (message.isMimeType("multipart/*")) {
            Multipart multipart = (Multipart) message.getContent();
            StringBuilder result = new StringBuilder();
            for (int i = 0; i < multipart.getCount(); i++) {
                BodyPart bodyPart = multipart.getBodyPart(i);
                if (bodyPart.isMimeType("text/plain")) {
                    Object content = bodyPart.getContent();
                    if (content != null) {
                        result.append(content.toString());
                    }
                } else if (bodyPart.isMimeType("text/html")) {
                    String html = bodyPart.getContent().toString();
                    result.append(html.replaceAll("<[^>]*>", " "));
                }
            }
            return result.toString();
        }
        return "";
    }

    private String extractEmail(String from) {
        if (from == null) return "";
        Pattern pattern = Pattern.compile("<([^>]+)>");
        Matcher matcher = pattern.matcher(from);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return from.trim();
    }

    private String extraireNumeroVisite(String text) {
        if (text == null) return null;

        Pattern pattern = Pattern.compile("(Visite|visite|VISITE|ID|N°|N[°o])\\s*[#n°]?\\s*(\\d+)");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(2);
        }

        pattern = Pattern.compile("\\b(\\d{2,3})\\b");
        matcher = pattern.matcher(text);
        while (matcher.find()) {
            String num = matcher.group(1);
            try {
                Integer id = Integer.parseInt(num);
                if (planningRepository.existsById(id)) {
                    return num;
                }
            } catch (NumberFormatException ignored) {}
        }

        return null;
    }
}