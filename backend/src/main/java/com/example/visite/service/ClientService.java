// service/ClientService.java
package com.example.visite.service;

import com.example.visite.model.Client;
import java.util.List;

public interface ClientService {
    Client createClient(Client client);
    Client updateClient(Client client);  // ← Cette méthode existe
    void deleteClient(Integer id);
    Client getClientById(Integer id);
    List<Client> getAllClients();
    List<Client> getActiveClients();
    List<Client> searchClients(String keyword);
    void importFromExcel(String filePath);
    void exportToExcel(String filePath);
}