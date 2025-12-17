package co.hyperflex.core.utils;

import java.security.SecureRandom;
import java.util.Base64;

public class SecretUtil {
  /**
   * Generate a secure random Base64-encoded secret of the specified length.
   *
   * @param length desired length in characters
   * @return Base64-encoded secret string
   */
  public static String generateSecret(int length) {
    SecureRandom secureRandom = new SecureRandom();
    int numBytes = (int) Math.ceil(length * 3 / 4.0);
    byte[] bytes = new byte[numBytes];
    secureRandom.nextBytes(bytes);

    String secret = Base64.getEncoder().withoutPadding().encodeToString(bytes);

    // Base64 might be slightly shorter due to padding removal, truncate if necessary
    if (secret.length() > length) {
      secret = secret.substring(0, length);
    }
    return secret;
  }
}
