package com.example.visite.controller;

import com.example.visite.model.Client;
import com.example.visite.model.Site;
import com.example.visite.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllClientsWithSites() {
        List<Client> clients = clientService.getAllClients();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Client client : clients) {
            if (client.getSites() != null && !client.getSites().isEmpty()) {
                // ✅ Pour chaque site du client, créer une entrée
                for (Site site : client.getSites()) {
                    Map<String, Object> entry = new HashMap<>();

                    entry.put("id", client.getId());
                    entry.put("nom", client.getNom());  // ← juste "amine"
                    entry.put("nomClient", client.getNom());
                    entry.put("siteId", site.getId());
                    entry.put("siteNom", site.getNom());  // ← "barcelona" ou "Site - amine"
                    entry.put("siteAdresse", site.getAdresse());
                    entry.put("emailContact", site.getEmailContact() != null ? site.getEmailContact() : client.getEmailContact());
                    entry.put("telephone", site.getTelephone() != null ? site.getTelephone() : client.getTelephone());
                    entry.put("adresseSiege", site.getAdresse() != null ? site.getAdresse() : client.getAdresseSiege());
                    entry.put("nbVisitesAn", client.getNbVisitesAn());
                    entry.put("actif", site.getActif());
                    entry.put("sites", List.of(site));

                    result.add(entry);
                }
            } else {
                Map<String, Object> entry = new HashMap<>();
                entry.put("id", client.getId());
                entry.put("nom", client.getNom());
                entry.put("nomClient", client.getNom());
                entry.put("siteId", null);
                entry.put("siteNom", null);
                entry.put("siteAdresse", null);
                entry.put("emailContact", client.getEmailContact());
                entry.put("telephone", client.getTelephone());
                entry.put("adresseSiege", client.getAdresseSiege());
                entry.put("nbVisitesAn", client.getNbVisitesAn());
                entry.put("actif", client.getActif());
                entry.put("sites", new ArrayList<>());
                result.add(entry);
            }
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Client> getClientById(@PathVariable Integer id) {
        return ResponseEntity.ok(clientService.getClientById(id));
    }

    @PostMapping
    public ResponseEntity<Client> createClient(@RequestBody Client client) {
        return new ResponseEntity<>(clientService.createClient(client), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Client> updateClient(@PathVariable Integer id, @RequestBody Client client) {
        client.setId(id);
        return ResponseEntity.ok(clientService.updateClient(client));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable Integer id) {
        clientService.deleteClient(id);
        return ResponseEntity.noContent().build();
    }
}