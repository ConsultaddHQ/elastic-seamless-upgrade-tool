package co.hyperflex.controllers.interceptors;

import co.hyperflex.annotations.Licensed;
import co.hyperflex.core.services.license.LicenseService;
import co.hyperflex.core.services.license.LicenseStatus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.lang.reflect.Method;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;


@Component
public class LicenseInterceptor implements HandlerInterceptor {
    @Autowired
    private LicenseService licenseService;


  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
    //Check for controller
    if(!(handler instanceof HandlerMethod)){
      return true;
    }

    HandlerMethod hm = (HandlerMethod) handler;
    Method method = hm.getMethod();

    Licensed ann = method.getAnnotation(Licensed.class);
    if (ann == null) {
      ann = method.getDeclaringClass().getAnnotation(Licensed.class);
    }

    if(ann == null){
      return true;
    }

    else{
      if(licenseService.currentLicense.getStatus() == LicenseStatus.ACTIVE){
        return true;
      }
      else{
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        String responseMessage = "";
        if(licenseService.currentLicense.getStatus() == LicenseStatus.EXPIRED){
          responseMessage = "Your License has expired on " + licenseService.currentLicense.getPayload().getExpiryDate().toString() + " Please contact the Sales team for new License";
        }
        else if(licenseService.currentLicense.getStatus() == LicenseStatus.INVALID){
          responseMessage = "Please Upload a valid license to continue using our services! Current License is Invalid";
        }
        else{
          responseMessage = "Please Add a License to use this service";
        }
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode body = mapper.createObjectNode();
        body.put("message",responseMessage);
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
  }
}
