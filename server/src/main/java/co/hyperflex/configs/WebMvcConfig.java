package co.hyperflex.configs;

import co.hyperflex.controllers.interceptors.LicenseInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

  private final LicenseInterceptor licenseInterceptor;

  public WebMvcConfig(LicenseInterceptor licenseInterceptor) {
    this.licenseInterceptor = licenseInterceptor;
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(licenseInterceptor)
        .addPathPatterns("/api/**")
        .excludePathPatterns("/api/v1/license/**", "/api/v1/auth/login");
    WebMvcConfigurer.super.addInterceptors(registry);
  }

}
