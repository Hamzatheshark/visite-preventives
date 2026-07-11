package com.example.visite;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class VisiteApplication {
	public static void main(String[] args) {
		SpringApplication.run(VisiteApplication.class, args);
	}
}