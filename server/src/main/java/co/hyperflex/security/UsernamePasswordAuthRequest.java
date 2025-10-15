package co.hyperflex.security;

public record UsernamePasswordAuthRequest(
    String username, String password
) {
}
