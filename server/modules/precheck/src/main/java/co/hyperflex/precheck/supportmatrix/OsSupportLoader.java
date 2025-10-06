package co.hyperflex.precheck.supportmatrix;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;

public class OsSupportLoader {
  private final ObjectMapper mapper = new ObjectMapper();

  public List<OsSupport> load(String resourceName) throws IOException {
    try (InputStream input = OsSupportLoader.class
        .getClassLoader()
        .getResourceAsStream(resourceName)) {

      if (input == null) {
        throw new IllegalArgumentException("Resource not found: " + resourceName);
      }

      return mapper.readValue(input, new TypeReference<>() {
      });
    }
  }
}
