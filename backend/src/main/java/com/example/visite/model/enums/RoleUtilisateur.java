// model/enums/RoleUtilisateur.java
package com.example.visite.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum RoleUtilisateur {
    ADMIN("Administrateur RMS", "Gestion complète de la plateforme"),
    RESPONSABLE_SOFTWARE("Responsable Software", "Planification et gestion des visites"),
    TECHNICIEN_HARDWARE("Technicien Hardware", "Consultation des plannings et interventions");

    private final String label;
    private final String description;

    RoleUtilisateur(String label, String description) {
        this.label = label;
        this.description = description;
    }

    //@JsonValue
    public String getLabel() {
        return label;
    }

    public String getDescription() {
        return description;
    }

    @JsonCreator
    public static RoleUtilisateur fromString(String value) {
        if (value == null) return null;

        // Essayer de trouver par nom exact
        try {
            return RoleUtilisateur.valueOf(value);
        } catch (IllegalArgumentException e) {
            // Si ce n'est pas un nom exact, chercher par label
            for (RoleUtilisateur role : RoleUtilisateur.values()) {
                if (role.getLabel().equals(value) || role.name().equals(value)) {
                    return role;
                }
            }
            return null;
        }
    }
}