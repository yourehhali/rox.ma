package ma.rox.api.config;

import java.util.Arrays;
import java.util.List;
import ma.rox.api.security.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

  @Value("${rox.cors.allowed-origins}")
  private String allowedOrigins;

  @Bean
  PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

  @Bean
  SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtFilter) throws Exception {
    http
        .csrf(AbstractHttpConfigurer::disable)
        .cors(Customizer.withDefaults())
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/auth/client/signup", "/auth/client/login", "/auth/client/refresh",
                          "/auth/admin/login", "/auth/admin/refresh").permitAll()
            .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/actuator/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/portfolio", "/portfolio/*").permitAll()
            .requestMatchers(HttpMethod.GET, "/content/**").permitAll()
            .requestMatchers(HttpMethod.POST,   "/portfolio", "/content/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.PATCH,  "/portfolio/**", "/content/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.PUT,    "/content/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.DELETE, "/portfolio/**", "/content/**").hasRole("ADMIN")
            .requestMatchers("/auth/admin/me", "/auth/admin/logout").hasRole("ADMIN")
            .requestMatchers("/clients/**", "/admin/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.PATCH, "/orders/*/phase", "/orders/*/status").hasRole("ADMIN")
            .requestMatchers(HttpMethod.POST,  "/orders/*/tasks/*/toggle", "/orders/*/requests/*/handle").hasRole("ADMIN")
            .requestMatchers(HttpMethod.POST,  "/bookings/*/confirm").hasRole("ADMIN")
            .requestMatchers("/auth/client/me", "/auth/client/logout", "/portal").hasRole("CLIENT")
            .requestMatchers(HttpMethod.POST, "/orders").hasRole("CLIENT")
            .requestMatchers(HttpMethod.POST, "/orders/*/requests").hasRole("CLIENT")
            .requestMatchers(HttpMethod.POST, "/bookings").hasRole("CLIENT")
            .requestMatchers("/orders/**", "/messages/**", "/bookings/**").authenticated()
            .anyRequest().authenticated())
        .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
        .exceptionHandling(e -> e
            .authenticationEntryPoint((req, res, ex) -> {
              res.setStatus(401);
              res.setContentType("application/json");
              res.getWriter().write("{\"error\":{\"code\":\"unauthorized\",\"message\":\"Session requise.\"}}");
            })
            .accessDeniedHandler((req, res, ex) -> {
              res.setStatus(403);
              res.setContentType("application/json");
              res.getWriter().write("{\"error\":{\"code\":\"forbidden\",\"message\":\"Accès refusé.\"}}");
            }));
    return http.build();
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(Arrays.stream(allowedOrigins.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList());
    cfg.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
    cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "Idempotency-Key"));
    cfg.setExposedHeaders(List.of("Authorization"));
    cfg.setAllowCredentials(false);
    UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
    src.registerCorsConfiguration("/**", cfg);
    return src;
  }
}
