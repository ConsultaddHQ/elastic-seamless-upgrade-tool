package co.hyperflex.controllers;

import co.hyperflex.dtos.settings.GetSettingResponse;
import co.hyperflex.dtos.settings.UpdateSettingRequest;
import co.hyperflex.dtos.settings.UpdateSettingResponse;
import co.hyperflex.services.SettingService;
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
  public UpdateSettingResponse updateSetting(@RequestBody UpdateSettingRequest request) {
    return settingService.updateSetting(request);
  }

  @GetMapping
  public GetSettingResponse getSetting() {
    return settingService.getSetting();
  }
}
