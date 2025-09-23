package co.hyperflex.core.services.settings;

import co.hyperflex.core.services.settings.dtos.GetSettingResponse;
import co.hyperflex.core.services.settings.dtos.UpdateSettingRequest;
import co.hyperflex.core.services.settings.dtos.UpdateSettingResponse;

public interface SettingService {
  GetSettingResponse getSetting();

  UpdateSettingResponse updateSetting(UpdateSettingRequest request);
}
