package co.hyperflex.controllers;

import co.hyperflex.core.services.settings.SettingService;
import co.hyperflex.core.services.settings.dtos.GetSettingResponse;
import co.hyperflex.core.services.settings.dtos.UpdateSettingRequest;
import co.hyperflex.core.services.settings.dtos.UpdateSettingResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/settings")
public class SettingController {

  private final SettingService settingService;

  public SettingController(SettingService settingService) {
    this.settingService = settingService;
  }

  @PostMapping
  public UpdateSettingResponse updateSetting(@Valid @RequestBody UpdateSettingRequest request) {
    return settingService.updateSetting(request);
  }

  @GetMapping
  public GetSettingResponse getSetting() {
    return settingService.getSetting();
  }
}
