package co.hyperflex.controllers;

import co.hyperflex.core.services.license.LicenseFile;
import co.hyperflex.core.services.license.LicenseService;
import co.hyperflex.core.services.settings.SettingService;
import co.hyperflex.core.services.settings.dtos.GetSettingResponse;
import co.hyperflex.core.services.settings.dtos.UpdateSettingRequest;
import co.hyperflex.core.services.settings.dtos.UpdateSettingResponse;
import jakarta.validation.Valid;
import java.io.IOException;
import java.text.ParseException;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/api/v1/settings")
public class SettingController {

  private final SettingService settingService;
  private final LicenseService licenseService;

  public SettingController(SettingService settingService, LicenseService licenseService) {
    this.settingService = settingService;
    this.licenseService = licenseService;
  }

  @PostMapping
  public UpdateSettingResponse updateSetting(@Valid @RequestBody UpdateSettingRequest request) {
    return settingService.updateSetting(request);
  }

  @GetMapping
  public GetSettingResponse getSetting() {
    return settingService.getSetting();
  }

  @PostMapping(value = "/add-license", consumes = "multipart/form-data")
  public ResponseEntity<Map<String,Object>> addLicense(@RequestParam("license") MultipartFile license) throws IOException, ParseException {
    try{

      if (license.isEmpty()) {
        return ResponseEntity.badRequest().body(Map.of("message","File is empty"));
      }
      LicenseFile licenseFile = new LicenseFile(
          license.getOriginalFilename(),
          license.getInputStream(),
          license.isEmpty()
      );
      return ResponseEntity.ok(licenseService.addLicense(licenseFile));
    }
    catch (Exception e){

      return ResponseEntity.internalServerError().body(Map.of("error",e.getMessage()));
    }

  }


}
