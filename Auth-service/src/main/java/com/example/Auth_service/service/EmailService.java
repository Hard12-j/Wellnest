package com.example.Auth_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    public void sendVerificationOtp(String to, String otp, int minutes) {
        send(to, "Verify your WellNest email", "email verification", otp, minutes);
    }

    public void sendPasswordResetOtp(String to, String otp, int minutes) {
        send(to, "WellNest password reset code", "password reset", otp, minutes);
    }

    private void send(String to, String subject, String purpose, String otp, int minutes) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(from);
        msg.setTo(to);
        msg.setSubject(subject);
        msg.setText("Your WellNest " + purpose + " code is " + otp + ".\n"
                + "It expires in " + minutes + " minutes. "
                + "If you didn't request this, you can ignore this email.");
        mailSender.send(msg);
    }
}