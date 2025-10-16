package co.hyperflex.controllers;

import co.hyperflex.common.exceptions.BadRequestException;
import co.hyperflex.security.AuthResponse;
import co.hyperflex.security.CreateUserRequest;
import co.hyperflex.security.JwtService;
import co.hyperflex.security.UserEntity;
import co.hyperflex.security.UserRepository;
import co.hyperflex.security.UsernamePasswordAuthRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private final AuthenticationManager authenticationManager;
  private final JwtService jwtService;
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  public AuthController(AuthenticationManager authenticationManager,
                        JwtService jwtService,
                        UserRepository userRepository,
                        PasswordEncoder passwordEncoder) {
    this.authenticationManager = authenticationManager;
    this.jwtService = jwtService;
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @PostMapping("/login")
  public AuthResponse login(
      @Valid @RequestBody UsernamePasswordAuthRequest authRequest
  ) {
    try {
      var authenticate =
          authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(authRequest.username(), authRequest.password()));
      var token = jwtService.generateToken((UserDetails) authenticate.getPrincipal());
      return new AuthResponse(token);
    } catch (Exception e) {
      throw new BadRequestException("Invalid username or password");
    }
  }

  @PostMapping("/signup")
  public ResponseEntity<String> createUser(@RequestBody CreateUserRequest user, HttpServletRequest request) {
    String remoteAddr = request.getRemoteAddr();
    if (!"127.0.0.1".equals(remoteAddr) && !"0:0:0:0:0:0:0:1".equals(remoteAddr)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
    }

    if (userRepository.findByUsername(user.username()) != null) {
      return ResponseEntity.status(HttpStatus.CONFLICT)
          .body("Username already exists");
    }

    UserEntity userEntity = new UserEntity();
    userEntity.setUsername(user.username());
    userEntity.setPassword(passwordEncoder.encode(user.password()));
    userEntity.setCreatedAt(Instant.now());
    userEntity.setUpdatedAt(Instant.now());
    userRepository.save(userEntity);
    return ResponseEntity.status(HttpStatus.CREATED).body("User created successfully");
  }
}
