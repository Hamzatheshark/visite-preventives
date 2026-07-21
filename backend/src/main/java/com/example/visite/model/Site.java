package com.example.visite.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Site")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Site {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "sites"})
    private Client client;

    @Column(nullable = false, length = 255)
    private String nom;

    @Column(length = 500)
    private String adresse;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(length = 255)
    private String emailContact;

    @Column(length = 50)
    private String telephone;

    @Column(nullable = false)
    private Boolean actif = true;

    @JsonIgnore
    @OneToMany(mappedBy = "site", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Planning> plannings = new ArrayList<>();
}