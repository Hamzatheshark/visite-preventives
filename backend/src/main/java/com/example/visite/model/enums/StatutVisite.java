// model/enums/StatutVisite.java
package com.example.visite.model.enums;

public enum StatutVisite {
    EN_ATTENTE("En attente", "#FFC107"),    // Jaune
    ACCEPTE("Accepté", "#4CAF50"),          // Vert
    REFUSE("Refusé", "#F44336"),            // Rouge
    RELANCE("Relancé", "#FF9800"),          // Orange
    CONFIRME("Confirmé", "#2196F3"),        // Bleu
    REALISE("Réalisé", "#9E9E9E"),          // Gris foncé
    ANNULE("Annulé", "#000000");            // Noir

    private final String label;
    private final String color;

    StatutVisite(String label, String color) {
        this.label = label;
        this.color = color;
    }

    public String getLabel() { return label; }
    public String getColor() { return color; }
}