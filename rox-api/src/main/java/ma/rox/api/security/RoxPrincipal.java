package ma.rox.api.security;

public record RoxPrincipal(String id, String email, Role role) {}
