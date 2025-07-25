package co.hyperflex.services;

import co.hyperflex.dtos.settings.GetSettingResponse;
import co.hyperflex.dtos.settings.UpdateSettingRequest;
import co.hyperflex.dtos.settings.UpdateSettingResponse;
import co.hyperflex.entities.Setting;
import co.hyperflex.mappers.SettingMapper;
import co.hyperflex.repositories.SettingRepository;
import org.springframework.stereotype.Service;

@Service
public class SettingService {
  private final SettingRepository settingRepository;
  private final SettingMapper settingMapper;

  public SettingService(SettingRepository settingRepository, SettingMapper settingMapper) {
    this.settingRepository = settingRepository;
    this.settingMapper = settingMapper;
  }

  public GetSettingResponse getSetting() {
    return settingRepository.findById("settings")
        .map(settingMapper::toResponse)
        .orElse(new GetSettingResponse(null));
  }

  public UpdateSettingResponse updateSetting(UpdateSettingRequest request) {
    Setting setting = settingRepository.findById("settings").orElse(new Setting());
    setting.setNotificationWebhookUrl(request.notificationWebhookUrl());
    settingRepository.save(setting);
    return new UpdateSettingResponse(request.notificationWebhookUrl());
  }

}
