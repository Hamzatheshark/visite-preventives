// service/PdfGenerationService.java
package com.example.visite.service;

import com.example.visite.model.Planning;
import java.io.File;

public interface PdfGenerationService {
    File generatePlanningPDF(Planning planning);
}