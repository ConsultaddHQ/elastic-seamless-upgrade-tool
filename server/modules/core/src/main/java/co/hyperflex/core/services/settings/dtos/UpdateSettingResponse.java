package co.hyperflex.core.services.settings.dtos;

import jakarta.annotation.Nullable;

public record UpdateSettingResponse(
    @Nullable String notificationWebhookUrl
) {
}
