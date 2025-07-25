package co.hyperflex.mappers;

import co.hyperflex.dtos.settings.GetSettingResponse;
import co.hyperflex.entities.Setting;
import org.springframework.stereotype.Component;

@Component
public class SettingMapper {

  public GetSettingResponse toResponse(Setting setting) {
    return new GetSettingResponse(setting.getNotificationWebhookUrl());
  }
}
