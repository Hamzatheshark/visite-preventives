// controller/PieceInterventionController.java - Version corrigée
package com.example.visite.controller;

import com.example.visite.model.PieceIntervention;
import com.example.visite.service.PieceInterventionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pieces")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class PieceInterventionController {

    private final PieceInterventionService pieceService;

    // Upload d'une pièce
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPiece(
            @RequestParam("file") MultipartFile file,
            @RequestParam("planningId") Integer planningId,
            @RequestParam(value = "description", required = false) String description) {

        try {
            log.info("📤 Upload de la pièce pour la visite {}: {}", planningId, file.getOriginalFilename());
            log.info("📤 Taille du fichier: {} bytes", file.getSize());
            log.info("📤 Type du fichier: {}", file.getContentType());

            // Vérifier que le fichier n'est pas vide
            if (file.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Le fichier est vide");
                return ResponseEntity.badRequest().body(error);
            }

            PieceIntervention piece = pieceService.uploadPiece(file, planningId, description);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Fichier uploadé avec succès");
            response.put("piece", piece);

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("❌ Erreur IO lors de l'upload: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur d'entrée/sortie: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'upload: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    // Récupérer toutes les pièces d'une visite
    @GetMapping("/intervention/planning/{planningId}")
    public ResponseEntity<List<PieceIntervention>> getPiecesByPlanning(@PathVariable Integer planningId) {
        try {
            List<PieceIntervention> pieces = pieceService.getPiecesByPlanning(planningId);
            return ResponseEntity.ok(pieces);
        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération des pièces: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Télécharger une pièce
    @GetMapping("/download/{pieceId}")
    public ResponseEntity<byte[]> downloadPiece(@PathVariable Integer pieceId) {
        try {
            PieceIntervention piece = pieceService.getPieceById(pieceId);
            byte[] content = pieceService.getFileContent(piece);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(piece.getTypeFichier()));
            headers.setContentDispositionFormData("attachment", piece.getNomFichier());

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(content);
        } catch (IOException e) {
            log.error("❌ Erreur lors du téléchargement: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        } catch (Exception e) {
            log.error("❌ Erreur lors du téléchargement: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Supprimer une pièce
    @DeleteMapping("/{pieceId}")
    public ResponseEntity<?> deletePiece(@PathVariable Integer pieceId) {
        try {
            pieceService.deletePiece(pieceId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Pièce supprimée avec succès");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Erreur lors de la suppression: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}