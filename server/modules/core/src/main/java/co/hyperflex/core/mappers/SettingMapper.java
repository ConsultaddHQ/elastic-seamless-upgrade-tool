package co.hyperflex.core.mappers;

import co.hyperflex.core.entites.settings.SettingEntity;
import co.hyperflex.core.services.settings.dtos.GetSettingResponse;
import org.springframework.stereotype.Component;

@Component
public class SettingMapper {

  public GetSettingResponse toResponse(SettingEntity setting) {
    return new GetSettingResponse(setting.getNotificationWebhookUrl());
  }
}
