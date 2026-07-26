// service/impl/SiteServiceImpl.java
package com.example.visite.service.impl;

import com.example.visite.model.Site;
import com.example.visite.repository.SiteRepository;
import com.example.visite.service.SiteService;
import com.example.visite.service.GeocodingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SiteServiceImpl implements SiteService {

    private final SiteRepository siteRepository;
    private final GeocodingService geocodingService;

    @Override
    public List<Site> getAllSites() {
        return siteRepository.findAll();
    }

    @Override
    public Site getSiteById(Integer id) {
        return siteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Site non trouvé avec l'ID: " + id));
    }

    @Override
    public List<Site> getSitesByClient(Integer clientId) {
        return siteRepository.findByClientId(clientId);
    }

    @Override
    @Transactional
    public Site createSite(Site site) {
        if (site.getAdresse() != null && !site.getAdresse().isEmpty()) {
            if (site.getLatitude() == null || site.getLongitude() == null) {
                geocodingService.geocodeSite(site);
            }
        }
        return siteRepository.save(site);
    }

    @Override
    @Transactional
    public Site updateSite(Site site) {
        Site existing = getSiteById(site.getId());

        existing.setNom(site.getNom());
        existing.setAdresse(site.getAdresse());
        existing.setEmailContact(site.getEmailContact());
        existing.setTelephone(site.getTelephone());
        existing.setActif(site.getActif());

        if (site.getAdresse() != null && !site.getAdresse().equals(existing.getAdresse())) {
            existing.setLatitude(null);
            existing.setLongitude(null);
            geocodingService.geocodeSite(existing);
        }

        return siteRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteSite(Integer id) {
        siteRepository.deleteById(id);
    }

    @Override
    @Transactional
    public Site geocodeSite(Integer siteId) {
        Site site = getSiteById(siteId);
        geocodingService.geocodeSite(site);
        return siteRepository.save(site);
    }
}