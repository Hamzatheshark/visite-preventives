// controller/SiteController.java
package com.example.visite.controller;

import com.example.visite.model.Site;
import com.example.visite.service.SiteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sites")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class SiteController {

    private final SiteService siteService;

    @GetMapping
    public ResponseEntity<List<Site>> getAllSites() {
        return ResponseEntity.ok(siteService.getAllSites());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Site> getSiteById(@PathVariable Integer id) {
        return ResponseEntity.ok(siteService.getSiteById(id));
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<Site>> getSitesByClient(@PathVariable Integer clientId) {
        return ResponseEntity.ok(siteService.getSitesByClient(clientId));
    }

    @PostMapping
    public ResponseEntity<Site> createSite(@RequestBody Site site) {
        return new ResponseEntity<>(siteService.createSite(site), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Site> updateSite(@PathVariable Integer id, @RequestBody Site site) {
        site.setId(id);
        return ResponseEntity.ok(siteService.updateSite(site));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSite(@PathVariable Integer id) {
        siteService.deleteSite(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/geocode/{id}")
    public ResponseEntity<Site> geocodeSite(@PathVariable Integer id) {
        try {
            Site site = siteService.geocodeSite(id);
            return ResponseEntity.ok(site);
        } catch (Exception e) {
            log.error("❌ Erreur lors du géocodage: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/geocode-all")
    public ResponseEntity<String> geocodeAllSites() {
        try {
            List<Site> sites = siteService.getAllSites();
            int count = 0;
            for (Site site : sites) {
                if (site.getAdresse() != null && !site.getAdresse().isEmpty()) {
                    if (site.getLatitude() == null || site.getLongitude() == null) {
                        siteService.geocodeSite(site.getId());
                        count++;
                    }
                }
            }
            return ResponseEntity.ok(count + " site(s) géocodé(s) avec succès");
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }
}