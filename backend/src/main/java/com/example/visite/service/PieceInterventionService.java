// service/PieceInterventionService.java
package com.example.visite.service;

import com.example.visite.model.PieceIntervention;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

public interface PieceInterventionService {
    PieceIntervention uploadPiece(MultipartFile file, Integer planningId, String description) throws IOException;
    List<PieceIntervention> getPiecesByPlanning(Integer planningId);
    PieceIntervention getPieceById(Integer pieceId);
    byte[] getFileContent(PieceIntervention piece) throws IOException;
    void deletePiece(Integer pieceId);
}