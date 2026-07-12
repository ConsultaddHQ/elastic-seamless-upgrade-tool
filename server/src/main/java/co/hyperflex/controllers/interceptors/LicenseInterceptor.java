package co.hyperflex.controllers.interceptors;

import co.hyperflex.core.services.license.License;
import co.hyperflex.core.services.license.LicenseService;
import co.hyperflex.core.services.license.LicenseStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;


@Component
public class LicenseInterceptor implements HandlerInterceptor {
  @Autowired
  private LicenseService licenseService;


  @Autowired
  private ObjectMapper mapper;

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {

    // Check if the handler is a controller method
    if (!(handler instanceof HandlerMethod)) {
      return true;
    }

    // Safely retrieve the current license
    License currentLicense = licenseService.getCurrentLicense();

    // If we have a license and it's active, let the request through
    if (currentLicense != null && currentLicense.getStatus() == LicenseStatus.ACTIVE) {
      return true;
    }

    String responseMessage;
    if (currentLicense == null) {
      responseMessage = "Please Add a License to use this service.";
    } else if (currentLicense.getStatus() == LicenseStatus.EXPIRED) {
      responseMessage = "Your License has expired on "
          + currentLicense.getPayload().getExpiryDate().toString()
          + ". Please contact the Sales team for a new License.";
    } else {
      responseMessage = "Please Upload a valid license to continue using our services! Current License is Invalid.";
    }

    ObjectMapper mapper = new ObjectMapper();
    ObjectNode body = mapper.createObjectNode();
    body.put("message", responseMessage);
    body.put("status", 403);
    body.put("path", request.getRequestURI());
    body.put("timestamp", System.currentTimeMillis());
    response.setContentType("application/json");
    response.setCharacterEncoding("UTF-8");
    response.setStatus(403);
    response.getWriter().write(mapper.writeValueAsString(body));
    return false;
  }
}
