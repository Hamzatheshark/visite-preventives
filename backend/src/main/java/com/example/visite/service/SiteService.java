// service/SiteService.java
package com.example.visite.service;

import com.example.visite.model.Site;
import java.util.List;

public interface SiteService {
    List<Site> getAllSites();
    Site getSiteById(Integer id);
    List<Site> getSitesByClient(Integer clientId);
    Site createSite(Site site);
    Site updateSite(Site site);
    void deleteSite(Integer id);
    Site geocodeSite(Integer siteId);
}