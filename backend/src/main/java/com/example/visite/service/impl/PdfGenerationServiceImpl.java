// service/impl/PdfGenerationServiceImpl.java
package com.example.visite.service.impl;

import com.example.visite.model.Planning;
import com.example.visite.service.PdfGenerationService;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.io.File;
import java.io.FileOutputStream;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class PdfGenerationServiceImpl implements PdfGenerationService {

    @Override
    public File generatePlanningPDF(Planning planning) {
        try {
            String fileName = "planning_" + planning.getId() + ".pdf";
            File file = new File(System.getProperty("java.io.tmpdir"), fileName);

            Document document = new Document();
            PdfWriter.getInstance(document, new FileOutputStream(file));
            document.open();

            // Add title
            Font titleFont = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD);
            Paragraph title = new Paragraph("Planning de Visite", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(Chunk.NEWLINE);

            // Add content
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            Font normalFont = new Font(Font.FontFamily.HELVETICA, 12);

            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);

            addRow(table, "Client", planning.getSite().getClient().getNom());
            addRow(table, "Site", planning.getSite().getNom());
            addRow(table, "Adresse", planning.getSite().getAdresse() != null ? planning.getSite().getAdresse() : "N/A");
            addRow(table, "Date Proposée", planning.getDateProposee().format(formatter));
            addRow(table, "Numéro Visite", String.valueOf(planning.getNumVisite()));
            addRow(table, "Statut", planning.getStatut().getLabel());

            document.add(table);
            document.close();

            return file;
        } catch (Exception e) {
            log.error("Error generating PDF", e);
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    private void addRow(PdfPTable table, String label, String value) {
        table.addCell(new Phrase(label + ":"));
        table.addCell(new Phrase(value));
    }
}