package co.hyperflex.configs;

import co.hyperflex.core.services.ConfigurationService;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.Ssl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SslConfig {

  private final ConfigurationService configService;

  public SslConfig(ConfigurationService configService) {
    this.configService = configService;
  }

  @Bean
  public TomcatServletWebServerFactory servletContainer() {
    Ssl ssl = new Ssl();
    ssl.setEnabled(true);
    ssl.setKeyStoreType("PKCS12");
    ssl.setKeyStore(configService.getOrInitialize("app.ssl.keystore.path", () -> "classpath:keystore/keystore.p12"));
    ssl.setKeyStorePassword(configService.getOrInitialize("app.ssl.keystore.password", () -> "changeit"));
    ssl.setKeyAlias(configService.getOrInitialize("app.ssl.keystore.alias", () -> "hyperflex"));
    ssl.setProtocol("TLS");
    ssl.setEnabledProtocols(new String[] {"TLSv1.2"});

    TomcatServletWebServerFactory tomcat = new TomcatServletWebServerFactory();
    tomcat.setSsl(ssl);
    return tomcat;
  }
}

