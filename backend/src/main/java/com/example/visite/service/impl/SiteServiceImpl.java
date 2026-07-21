package com.example.visite.service.impl;

import com.example.visite.model.Site;
import com.example.visite.model.Client;
import com.example.visite.repository.SiteRepository;
import com.example.visite.repository.ClientRepository;
import com.example.visite.service.SiteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SiteServiceImpl implements SiteService {

    private final SiteRepository siteRepository;
    private final ClientRepository clientRepository;

    @Override
    @Transactional
    public Site createSite(Site site) {
        // ✅ Vérifier que le client existe
        if (site.getClient() == null || site.getClient().getId() == null) {
            throw new IllegalArgumentException("Le client est requis pour créer un site");
        }

        Client client = clientRepository.findById(site.getClient().getId())
                .orElseThrow(() -> new RuntimeException("Client non trouvé avec l'ID: " + site.getClient().getId()));

        site.setClient(client);
        site.setActif(true);
        return siteRepository.save(site);
    }

    @Override
    @Transactional
    public Site updateSite(Site site) {
        // ✅ Vérifier que le site existe
        Site existingSite = siteRepository.findById(site.getId())
                .orElseThrow(() -> new RuntimeException("Site non trouvé avec l'ID: " + site.getId()));

        // ✅ Conserver le client existant
        if (site.getClient() == null || site.getClient().getId() == null) {
            site.setClient(existingSite.getClient());
        }

        return siteRepository.save(site);
    }

    @Override
    @Transactional
    public void deleteSite(Integer id) {
        Site site = siteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Site non trouvé avec l'ID: " + id));
        siteRepository.delete(site);
    }

    @Override
    public Site getSiteById(Integer id) {
        return siteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Site non trouvé avec l'ID: " + id));
    }

    @Override
    public List<Site> getAllSites() {
        return siteRepository.findAll();
    }

    @Override
    public List<Site> getSitesByClient(Integer clientId) {
        return siteRepository.findByClientId(clientId);
    }
}