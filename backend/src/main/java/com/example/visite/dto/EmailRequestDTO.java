// dto/EmailRequestDTO.java
package com.example.visite.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailRequestDTO {
    private String to;
    private String subject;
    private String body;
    private String attachmentPath;
}