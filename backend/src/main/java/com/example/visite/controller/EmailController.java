// controller/EmailController.java
package com.example.visite.controller;

import com.example.visite.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/emails")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class EmailController {

    private final EmailService emailService;

    @PostMapping("/send-proposition/{planningId}")
    public ResponseEntity<Void> sendProposition(@PathVariable Integer planningId) {
        // This is handled by PlanningService
        return ResponseEntity.ok().build();
    }

    @PostMapping("/send-relance/{planningId}")
    public ResponseEntity<Void> sendRelance(@PathVariable Integer planningId) {
        // This is handled by PlanningService
        return ResponseEntity.ok().build();
    }
}