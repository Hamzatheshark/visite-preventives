// service/GeocodingService.java - Vérifier qu'il n'y a pas d'import Adresse
package com.example.visite.service;

import com.example.visite.model.Site;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
@Slf4j
public class GeocodingService {

    private static final double EARTH_RADIUS = 6371.0;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Coordinates geocodeAddress(String address) {
        try {
            if (address == null || address.isEmpty()) {
                log.warn("⚠️ Adresse vide");
                return null;
            }

            String encodedAddress = java.net.URLEncoder.encode(address, "UTF-8");
            String url = "https://nominatim.openstreetmap.org/search?q=" + encodedAddress +
                    "&format=json&limit=1";

            log.info("🌍 Géocodage de l'adresse: {}", address);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", "RMS-App/1.0")
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode json = objectMapper.readTree(response.body());
                if (json.isArray() && json.size() > 0) {
                    JsonNode firstResult = json.get(0);
                    double lat = firstResult.get("lat").asDouble();
                    double lon = firstResult.get("lon").asDouble();

                    log.info("✅ Coordonnées trouvées: lat={}, lon={}", lat, lon);
                    return new Coordinates(lat, lon);
                } else {
                    log.warn("⚠️ Aucun résultat pour l'adresse: {}", address);
                }
            } else {
                log.warn("⚠️ Erreur API: {}", response.statusCode());
            }

        } catch (IOException | InterruptedException e) {
            log.error("❌ Erreur lors du géocodage: {}", e.getMessage());
        }

        return null;
    }

    public void geocodeSite(Site site) {
        if (site == null || site.getAdresse() == null || site.getAdresse().isEmpty()) {
            return;
        }

        if (site.getLatitude() != null && site.getLongitude() != null) {
            return;
        }

        Coordinates coords = geocodeAddress(site.getAdresse());
        if (coords != null) {
            site.setLatitude(coords.lat);
            site.setLongitude(coords.lon);
            log.info("✅ Site {} géocodé: lat={}, lon={}", site.getNom(), coords.lat, coords.lon);
        }
    }

    public double calculateDistance(Site site1, Site site2) {
        if (site1.getLatitude() == null || site1.getLongitude() == null) {
            geocodeSite(site1);
        }
        if (site2.getLatitude() == null || site2.getLongitude() == null) {
            geocodeSite(site2);
        }

        if (site1.getLatitude() == null || site1.getLongitude() == null ||
                site2.getLatitude() == null || site2.getLongitude() == null) {
            return Double.MAX_VALUE;
        }

        double lat1 = Math.toRadians(site1.getLatitude());
        double lon1 = Math.toRadians(site1.getLongitude());
        double lat2 = Math.toRadians(site2.getLatitude());
        double lon2 = Math.toRadians(site2.getLongitude());

        double dlat = lat2 - lat1;
        double dlon = lon2 - lon1;

        double a = Math.pow(Math.sin(dlat / 2), 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                        Math.pow(Math.sin(dlon / 2), 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS * c;
    }

    public static class Coordinates {
        public double lat;
        public double lon;

        public Coordinates(double lat, double lon) {
            this.lat = lat;
            this.lon = lon;
        }
    }
}