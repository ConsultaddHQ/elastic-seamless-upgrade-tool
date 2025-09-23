package co.hyperflex.core.services.settings.dtos;

import jakarta.annotation.Nullable;

public record GetSettingResponse(
    @Nullable String notificationWebhookUrl
) {
}
