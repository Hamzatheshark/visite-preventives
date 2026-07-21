package com.example.visite.repository;

import com.example.visite.model.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SiteRepository extends JpaRepository<Site, Integer> {
    List<Site> findByClientId(Integer clientId);
    List<Site> findByClientIdAndActifTrue(Integer clientId);
    List<Site> findByActifTrue();
}