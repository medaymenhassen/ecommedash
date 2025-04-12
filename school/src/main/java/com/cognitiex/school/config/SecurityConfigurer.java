package com.cognitiex.school.config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.web.header.writers.StaticHeadersWriter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfigurer {

    private final JwtRequestFilter jwtRequestFilter;

    public SecurityConfigurer(JwtRequestFilter jwtRequestFilter) {
        this.jwtRequestFilter = jwtRequestFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()) // Utilisation des cookies pour les tokens CSRF
                .ignoringRequestMatchers("/api/refresh-token","/api/order/**", "/api/address/**","/api/authenticate", "/api/submit", "/api/images/**", "/api/video/**", "/api/sitemap.xml", "/api/robots.txt","/api/delete/**", "/api/change-password/**", "/api/products/**", "/api/products", "/api/length/**","/api/attribut/**", "/api/categories/**", "/api/brand/**", "/api/color/**", "/api/size/**", "/api/chat","/api/customer-orders/register", "/api/customer-orders/company/create","/api/customer-orders/company/list","/api/customer-orders/company/generate-invite/**","/api/customer-orders/company/delete/**","/api/customer-orders/company/update/**", "/api/customer-orders/company/join/**", "/api/customer-orders/relation", "/api/customer-orders/relation/**", "/api/customer-orders/supply/**", "/api/customer-orders/supply","/api/customer-orders/supply/filter/**","/api/customer-orders/products/create","/api/customer-orders/products/update/**","/api/customer-orders/products/delete/**", "/api/customer-orders/products/filter/**", "/api/customer-orders/products/update-quantity", "/api/customer-orders/companysupply/filter/**","/api/customer-orders/profile/**") // Ignorer les requêtes CSRF sur ces endpoints
            )
            .authorizeHttpRequests(auth -> auth
                // Les endpoints suivants sont protégés par CSRF
                .requestMatchers("/api/refresh-token","/api/attribut/**","/api/products", "/api/products/**", "/api/categories/**", "/api/brand/**", "/api/color/**", "/api/size/**", "/api/length/**","/api/authenticate", "/api/submit", "/api/images/**", "/api/video/**", "/api/sitemap.xml", "/api/robots.txt","/api/customer-orders/register", "/api/customer-orders/products/update-quantity").permitAll()
                // Les endpoints suivants nécessitent une authentification JWT
                .requestMatchers("/api/order/**","/api/delete/**", "/api/change-password/**", "/api/chat", "/api/address/**","/api/customer-orders/company/create","/api/customer-orders/company/list","/api/customer-orders/company/generate-invite/**","/api/customer-orders/company/delete/**","/api/customer-orders/company/update/**", "/api/customer-orders/company/join/**", "/api/customer-orders/relation", "/api/customer-orders/relation/**", "/api/customer-orders/supply/**", "/api/customer-orders/supply","/api/customer-orders/supply/filter/**","/api/customer-orders/products/create","/api/customer-orders/products/update/**","/api/customer-orders/products/delete/**", "/api/customer-orders/products/filter/**", "/api/customer-orders/companysupply/filter/","/api/customer-orders/profile/**").authenticated()
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // Pour JWT
            )
            .cors(cors -> cors
                .configurationSource(corsConfigurationSource())
            )
            .headers(headers -> headers
                .contentSecurityPolicy(policy -> policy.policyDirectives("default-src 'self'; script-src 'self'"))
                .frameOptions(frameOptions -> frameOptions.deny())
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000))
                .addHeaderWriter(new StaticHeadersWriter("X-Content-Type-Options", "nosniff"))
            );

        // Ajout du filtre JWT
        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowCredentials(true);
        
        // Ajoute à la liste des origines autorisées
        configuration.setAllowedOrigins(Arrays.asList("https://www.cognitiex.com", "http://localhost:4200"));
        configuration.setAllowedHeaders(Arrays.asList("Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration.setExposedHeaders(Arrays.asList("Content-Type", "Authorization"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}

