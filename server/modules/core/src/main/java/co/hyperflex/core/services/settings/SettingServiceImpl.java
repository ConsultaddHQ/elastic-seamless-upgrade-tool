package co.hyperflex.core.services.settings;

import co.hyperflex.core.entites.settings.SettingEntity;
import co.hyperflex.core.mappers.SettingMapper;
import co.hyperflex.core.repositories.SettingRepository;
import co.hyperflex.core.services.settings.dtos.GetSettingResponse;
import co.hyperflex.core.services.settings.dtos.UpdateSettingRequest;
import co.hyperflex.core.services.settings.dtos.UpdateSettingResponse;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class SettingServiceImpl implements SettingService {
  private final SettingRepository settingRepository;
  private final SettingMapper settingMapper;

  public SettingServiceImpl(SettingRepository settingRepository, SettingMapper settingMapper) {
    this.settingRepository = settingRepository;
    this.settingMapper = settingMapper;
  }

  @Cacheable(value = "settingCache")
  @Override
  public GetSettingResponse getSetting() {
    return settingRepository.findById("settings")
        .map(settingMapper::toResponse)
        .orElse(new GetSettingResponse(null));
  }

  @CacheEvict(value = "settingCache", allEntries = true)
  @Override
  public UpdateSettingResponse updateSetting(UpdateSettingRequest request) {
    SettingEntity setting = settingRepository.findById("settings").orElse(new SettingEntity());
    setting.setNotificationWebhookUrl(request.notificationWebhookUrl());
    settingRepository.save(setting);
    return new UpdateSettingResponse(request.notificationWebhookUrl());
  }

}
