package co.hyperflex.controllers;

import co.hyperflex.security.AuthResponse;
import co.hyperflex.security.JwtService;
import co.hyperflex.security.UsernamePasswordAuthRequest;
import jakarta.validation.Valid;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private final AuthenticationManager authenticationManager;
  private final JwtService jwtService;

  public AuthController(AuthenticationManager authenticationManager,
                        JwtService jwtService) {
    this.authenticationManager = authenticationManager;
    this.jwtService = jwtService;
  }

  @PostMapping("/login")
  public AuthResponse login(
      @Valid @RequestBody UsernamePasswordAuthRequest authRequest
  ) {
    var authenticate =
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(authRequest.username(), authRequest.password()));
    var token = jwtService.generateToken((UserDetails) authenticate.getPrincipal());
    return new AuthResponse(token);
  }


}
