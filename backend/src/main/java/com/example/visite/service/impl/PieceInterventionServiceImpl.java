// service/impl/PieceInterventionServiceImpl.java - Version corrigée (sans doublon)
package com.example.visite.service.impl;

import com.example.visite.model.PieceIntervention;
import com.example.visite.model.Planning;
import com.example.visite.repository.PieceInterventionRepository;
import com.example.visite.repository.PlanningRepository;
import com.example.visite.service.PieceInterventionService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PieceInterventionServiceImpl implements PieceInterventionService {

    private final PieceInterventionRepository pieceRepository;
    private final PlanningRepository planningRepository;

    @Value("${app.upload.dir:uploads/pieces}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                log.info("✅ Dossier d'upload créé: {}", uploadPath.toAbsolutePath());
            } else {
                log.info("✅ Dossier d'upload existe déjà: {}", uploadPath.toAbsolutePath());
            }
        } catch (IOException e) {
            log.error("❌ Erreur lors de la création du dossier d'upload: {}", e.getMessage());
        }
    }

    // ✅ UNE SEULE MÉTHODE uploadPiece (avec upload_par)
    @Override
    @Transactional
    public PieceIntervention uploadPiece(MultipartFile file, Integer planningId, String description) throws IOException {
        log.info("📤 Début de l'upload pour la visite {}", planningId);

        try {
            // Vérifier que la visite existe
            Planning planning = planningRepository.findById(planningId)
                    .orElseThrow(() -> new RuntimeException("Planning non trouvé avec l'ID: " + planningId));

            // Créer le dossier si nécessaire
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                log.info("📁 Dossier créé: {}", uploadPath.toAbsolutePath());
            }

            // Générer un nom unique pour le fichier
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isEmpty()) {
                throw new IOException("Nom de fichier invalide");
            }

            String extension = "";
            if (originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String uniqueFilename = UUID.randomUUID().toString() + extension;

            // Sauvegarder le fichier
            Path filePath = uploadPath.resolve(uniqueFilename);
            log.info("💾 Sauvegarde du fichier: {}", filePath.toAbsolutePath());
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Créer l'entité
            PieceIntervention piece = new PieceIntervention();
            piece.setPlanning(planning);
            piece.setNomFichier(originalFilename);
            piece.setCheminFichier(filePath.toString());
            piece.setTypeFichier(file.getContentType());
            piece.setTaille(file.getSize());
            piece.setDescription(description);
            piece.setDateUpload(LocalDateTime.now());
            piece.setUploadPar("Administrateur"); // ✅ Valeur par défaut

            // Sauvegarder en base
            PieceIntervention saved = pieceRepository.save(piece);
            log.info("✅ Pièce sauvegardée avec l'ID: {}", saved.getId());

            return saved;

        } catch (Exception e) {
            log.error("❌ Erreur lors de l'upload: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Override
    public List<PieceIntervention> getPiecesByPlanning(Integer planningId) {
        try {
            Planning planning = planningRepository.findById(planningId)
                    .orElseThrow(() -> new RuntimeException("Planning non trouvé"));
            return pieceRepository.findByPlanning(planning);
        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération des pièces: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Override
    public PieceIntervention getPieceById(Integer pieceId) {
        try {
            return pieceRepository.findById(pieceId)
                    .orElseThrow(() -> new RuntimeException("Pièce non trouvée avec l'ID: " + pieceId));
        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération de la pièce: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Override
    public byte[] getFileContent(PieceIntervention piece) throws IOException {
        try {
            Path filePath = Paths.get(piece.getCheminFichier());
            if (!Files.exists(filePath)) {
                throw new IOException("Fichier non trouvé: " + piece.getCheminFichier());
            }
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            log.error("❌ Erreur lors de la lecture du fichier: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Override
    @Transactional
    public void deletePiece(Integer pieceId) {
        try {
            PieceIntervention piece = getPieceById(pieceId);

            // Supprimer le fichier physique
            Path filePath = Paths.get(piece.getCheminFichier());
            boolean deleted = Files.deleteIfExists(filePath);
            if (deleted) {
                log.info("🗑️ Fichier supprimé: {}", filePath);
            } else {
                log.warn("⚠️ Fichier non trouvé: {}", filePath);
            }

            pieceRepository.delete(piece);
            log.info("🗑️ Pièce supprimée de la base avec l'ID: {}", pieceId);

        } catch (IOException e) {
            log.error("❌ Erreur lors de la suppression du fichier: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la suppression", e);
        }
    }
}