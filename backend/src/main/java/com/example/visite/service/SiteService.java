package com.example.visite.service;

import com.example.visite.model.Site;
import java.util.List;

public interface SiteService {
    Site createSite(Site site);
    Site updateSite(Site site);
    void deleteSite(Integer id);
    Site getSiteById(Integer id);
    List<Site> getAllSites();
    List<Site> getSitesByClient(Integer clientId);
}