package co.hyperflex.controllers;

import co.hyperflex.common.exceptions.BadRequestException;
import co.hyperflex.common.exceptions.ConflictException;
import co.hyperflex.common.exceptions.ForbiddenException;
import co.hyperflex.common.exceptions.NotFoundException;
import co.hyperflex.security.AuthResponse;
import co.hyperflex.security.CreateUserRequest;
import co.hyperflex.security.CreateUserResponse;
import co.hyperflex.security.JwtService;
import co.hyperflex.security.ResetPasswordRequest;
import co.hyperflex.security.User;
import co.hyperflex.security.UserEntity;
import co.hyperflex.security.UserRepository;
import co.hyperflex.security.UsernamePasswordAuthRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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

  private static void isForbidden(HttpServletRequest request) {
    String remoteAddr = request.getRemoteAddr();
    if (!"127.0.0.1".equals(remoteAddr) && !"0:0:0:0:0:0:0:1".equals(remoteAddr)) {
      throw new ForbiddenException("Access denied");
    }
  }

  @PostMapping("/signup")
  public CreateUserResponse createUser(@RequestBody CreateUserRequest user, HttpServletRequest request) {
    isForbidden(request);

    if (userRepository.findByUsername(user.username()) != null) {
      throw new ConflictException("Username already exists");
    }

    UserEntity userEntity = new UserEntity();
    userEntity.setUsername(user.username());
    userEntity.setPassword(passwordEncoder.encode(user.password()));
    userEntity.setCreatedAt(Instant.now());
    userEntity.setUpdatedAt(Instant.now());
    userRepository.save(userEntity);
    return new CreateUserResponse("User created successfully");
  }

  @GetMapping("/users")
  public List<User> getUsers(HttpServletRequest request) {
    isForbidden(request);
    return userRepository
        .findAll()
        .stream()
        .map(userEntity -> new User(userEntity.getUsername())).toList();
  }

  @PutMapping("/users/{username}/reset-password")
  public ResponseEntity<String> resetPassword(
      HttpServletRequest request,
      @PathVariable String username,
      @RequestBody ResetPasswordRequest resetPasswordRequest) {

    isForbidden(request);
    UserEntity userEntity = userRepository.findByUsername(username);
    if (userEntity == null) {
      throw new NotFoundException("User not found");
    }

    userRepository.updateById(userEntity.getId(),
        Update.update("password", passwordEncoder.encode(resetPasswordRequest.password())));

    return ResponseEntity.status(HttpStatus.CREATED).body("Password reset successfully");
  }

  @DeleteMapping("/users/{username}")
  public ResponseEntity<String> deleteUser(HttpServletRequest request, @PathVariable String username) {
    isForbidden(request);

    UserEntity userEntity = userRepository.findByUsername(username);
    if (userEntity == null) {
      throw new NotFoundException("User not found");
    }

    userRepository.delete(userEntity);
    return ResponseEntity.status(HttpStatus.OK).body("User deleted successfully");
  }
}
