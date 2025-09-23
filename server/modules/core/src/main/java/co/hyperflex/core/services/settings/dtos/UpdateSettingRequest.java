package co.hyperflex.core.services.settings.dtos;

import jakarta.annotation.Nullable;

public record UpdateSettingRequest(
    @Nullable String notificationWebhookUrl
) {
}
