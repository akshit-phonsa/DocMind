package com.example.docmind.docmind_backend.controller;

import com.example.docmind.docmind_backend.dto.LoginRequest;
import com.example.docmind.docmind_backend.dto.LoginResponse;
import com.example.docmind.docmind_backend.dto.RegisterUserRequest;
import com.example.docmind.docmind_backend.dto.UserDto;
import com.example.docmind.docmind_backend.entity.User;
import com.example.docmind.docmind_backend.repository.UserRepository;
import com.example.docmind.docmind_backend.service.CustomUserDetail;
import com.example.docmind.docmind_backend.service.JwtService;
import com.example.docmind.docmind_backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    private final AuthenticationManager authenticationManager;

    private final UserRepository userRepository;

    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest){
        //TODO
        //authenticate and return the token and user
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                loginRequest.username(),
                loginRequest.password()
        );
        Authentication authenticated = authenticationManager.authenticate(authentication);
        User user = userRepository.findByUsername(loginRequest.username()).orElseThrow(()-> new RuntimeException("User not found"));
        String token = jwtService.generateToken(new CustomUserDetail(user));
        var response = new LoginResponse(token, new UserDto(user.getId(), user.getUsername(), user.getEmail(), user.getRole()));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegisterUserRequest registerUserRequest){
        //TODO
        //register the user and return the user

        UserDto userDto = userService.registerUser(registerUserRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(userDto);
    }
}
