// dto/RegisterRequest.java
package com.example.visite.dto;

import com.example.visite.model.enums.RoleUtilisateur;
import lombok.Data;

@Data
public class RegisterRequest {
    private String nom;
    private String prenom;
    private String email;
    private String motPasse;
    private String telephone;
    private String role;

    public RoleUtilisateur getRoleEnum() {
        if (role == null) return null;
        try {
            return RoleUtilisateur.valueOf(role);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}