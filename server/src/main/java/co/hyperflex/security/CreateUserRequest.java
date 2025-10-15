package co.hyperflex.security;

import jakarta.validation.constraints.NotEmpty;

public record CreateUserRequest(
    @NotEmpty String username, @NotEmpty String password
) {
}
