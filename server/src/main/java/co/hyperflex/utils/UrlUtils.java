package co.hyperflex.utils;

import co.hyperflex.exceptions.BadRequestException;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;

public class UrlUtils {

  public static String validateAndCleanUrl(String url) {
    if (url == null || url.isBlank()) {
      throw new BadRequestException("URL cannot be null or blank");
    }

    try {
      new URI(url).toURL();
      return url.replaceAll("/+$", ""); // Remove one or more trailing slashes
    } catch (URISyntaxException | MalformedURLException e) {
      throw new BadRequestException("Invalid URL format: " + url);
    }
  }
}

