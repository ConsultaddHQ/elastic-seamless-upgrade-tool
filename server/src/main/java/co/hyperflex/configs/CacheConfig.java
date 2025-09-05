package co.hyperflex.configs;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.util.List;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@EnableCaching
@Configuration
public class CacheConfig {
  private static final Logger log = LoggerFactory.getLogger(CacheConfig.class);

  private static CaffeineCache getElasticClientCache() {
    return new CaffeineCache("elasticClientCache",
        Caffeine.newBuilder().expireAfterAccess(20, TimeUnit.MINUTES).build());
  }

  private static CaffeineCache getSettingCache() {
    return new CaffeineCache("settingCache",
        Caffeine.newBuilder().expireAfterAccess(10, TimeUnit.MINUTES).build());
  }

  @Bean
  public CacheManager cacheManager() {
    SimpleCacheManager manager = new SimpleCacheManager();
    manager.setCaches(List.of(
        getElasticClientCache(),
        getSettingCache()
    ));
    return manager;
  }

}
