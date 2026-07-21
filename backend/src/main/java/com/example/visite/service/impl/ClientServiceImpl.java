package com.example.visite.service.impl;

import com.example.visite.model.Client;
import com.example.visite.model.Site;
import com.example.visite.repository.ClientRepository;
import com.example.visite.repository.SiteRepository;
import com.example.visite.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;
    private final SiteRepository siteRepository;

    @Override
    @Transactional
    public Client createClient(Client client) {
        try {
            System.out.println("📝 Création client dans le service");
            if (client.getNbVisitesAn() == null) {
                client.setNbVisitesAn(4);
            }

            // Sauvegarder le client
            Client saved = clientRepository.save(client);
            System.out.println("✅ Client sauvegardé avec ID: " + saved.getId());

            // Créer un site par défaut automatiquement avec les mêmes infos
            Site defaultSite = new Site();
            defaultSite.setClient(saved);
            defaultSite.setNom("Site - " + saved.getNom());
            defaultSite.setAdresse(saved.getAdresseSiege());
            defaultSite.setEmailContact(saved.getEmailContact());
            defaultSite.setTelephone(saved.getTelephone());
            defaultSite.setActif(true);

            Site savedSite = siteRepository.save(defaultSite);
            System.out.println("✅ Site par défaut créé avec ID: " + savedSite.getId() + " pour le client: " + saved.getNom());

            return saved;
        } catch (Exception e) {
            System.err.println("❌ Erreur dans createClient: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Override
    @Transactional
    public Client updateClient(Client client) {
        return clientRepository.save(client);
    }

    @Override
    @Transactional
    public void deleteClient(Integer id) {
        // Supprimer d'abord les sites associés
        List<Site> sites = siteRepository.findByClientId(id);
        for (Site site : sites) {
            siteRepository.delete(site);
        }
        // Puis supprimer le client
        clientRepository.deleteById(id);
    }

    @Override
    public Client getClientById(Integer id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found with id: " + id));
    }

    @Override
    public List<Client> getAllClients() {
        try {
            List<Client> clients = clientRepository.findAll();
            System.out.println("📋 Récupération de " + clients.size() + " clients");
            return clients;
        } catch (Exception e) {
            System.err.println("❌ Erreur dans getAllClients: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Override
    public List<Client> getActiveClients() {
        return clientRepository.findByActifTrue();
    }

    @Override
    public List<Client> searchClients(String keyword) {
        return clientRepository.findByNomContainingIgnoreCase(keyword);
    }

    @Override
    public void importFromExcel(String filePath) {
        // TODO: Implement Excel import
    }

    @Override
    public void exportToExcel(String filePath) {
        // TODO: Implement Excel export
    }
}