package co.hyperflex.security;

public record CreateUserRequest(
    String username, String password
) {
}
