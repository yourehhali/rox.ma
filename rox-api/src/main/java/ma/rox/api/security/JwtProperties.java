package ma.rox.api.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "rox.jwt")
public record JwtProperties(
    String secret,
    long accessTtlMinutes,
    long refreshTtlDays,
    String issuer
) {}
