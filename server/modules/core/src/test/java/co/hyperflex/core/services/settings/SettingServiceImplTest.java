package co.hyperflex.core.services.settings;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import co.hyperflex.core.entites.settings.SettingEntity;
import co.hyperflex.core.mappers.SettingMapper;
import co.hyperflex.core.repositories.SettingRepository;
import co.hyperflex.core.services.settings.dtos.GetSettingResponse;
import co.hyperflex.core.services.settings.dtos.UpdateSettingRequest;
import co.hyperflex.core.services.settings.dtos.UpdateSettingResponse;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SettingServiceImplTest {

  @Mock
  private SettingRepository settingRepository;

  @Mock
  private SettingMapper settingMapper;

  @InjectMocks
  private SettingServiceImpl settingService;

  @Test
  void getSetting_whenSettingExists() {
    // Arrange
    SettingEntity setting = new SettingEntity();
    setting.setNotificationWebhookUrl("http://example.com");
    GetSettingResponse responseDto = new GetSettingResponse("http://example.com");

    when(settingRepository.findById("settings")).thenReturn(Optional.of(setting));
    when(settingMapper.toResponse(setting)).thenReturn(responseDto);

    // Act
    GetSettingResponse result = settingService.getSetting();

    // Assert
    assertNotNull(result);
    assertEquals("http://example.com", result.notificationWebhookUrl());
    verify(settingRepository).findById("settings");
    verify(settingMapper).toResponse(setting);
  }

  @Test
  void getSetting_whenSettingDoesNotExist() {
    // Arrange
    when(settingRepository.findById("settings")).thenReturn(Optional.empty());

    // Act
    GetSettingResponse result = settingService.getSetting();

    // Assert
    assertNotNull(result);
    assertNull(result.notificationWebhookUrl());
    verify(settingRepository).findById("settings");
    verify(settingMapper, never()).toResponse(any());
  }

  @Test
  void updateSetting_whenSettingExists() {
    // Arrange
    SettingEntity existingSetting = new SettingEntity();
    existingSetting.setNotificationWebhookUrl("http://old-url.com");

    when(settingRepository.findById("settings")).thenReturn(Optional.of(existingSetting));
    when(settingRepository.save(any(SettingEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
    UpdateSettingRequest request = new UpdateSettingRequest("http://new-url.com");

    // Act
    UpdateSettingResponse result = settingService.updateSetting(request);

    // Assert
    assertNotNull(result);
    assertEquals("http://new-url.com", result.notificationWebhookUrl());
    verify(settingRepository).findById("settings");
    verify(settingRepository).save(argThat(savedSetting ->
        "http://new-url.com".equals(savedSetting.getNotificationWebhookUrl())
    ));
  }

  @Test
  void updateSetting_whenSettingDoesNotExist() {
    // Arrange
    UpdateSettingRequest request = new UpdateSettingRequest("http://new-url.com");

    when(settingRepository.findById("settings")).thenReturn(Optional.empty());
    when(settingRepository.save(any(SettingEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

    // Act
    UpdateSettingResponse result = settingService.updateSetting(request);

    // Assert
    assertNotNull(result);
    assertEquals("http://new-url.com", result.notificationWebhookUrl());
    verify(settingRepository).findById("settings");
    verify(settingRepository).save(argThat(savedSetting ->
        "settings".equals(savedSetting.getId())
            && "http://new-url.com".equals(savedSetting.getNotificationWebhookUrl())
    ));
  }
}