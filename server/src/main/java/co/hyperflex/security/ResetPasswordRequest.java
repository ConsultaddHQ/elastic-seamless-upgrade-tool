package co.hyperflex.security;

import jakarta.validation.constraints.NotEmpty;

public record ResetPasswordRequest(
    @NotEmpty String password
) {
}
