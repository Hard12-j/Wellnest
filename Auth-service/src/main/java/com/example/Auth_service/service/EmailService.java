package com.example.Auth_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String from;

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${brevo.sender.email:}")
    private String brevoSenderEmail;

    @Value("${brevo.sender.name:WellNest}")
    private String brevoSenderName;

    @Value("${resend.api.key:}")
    private String resendApiKey;

    @Value("${resend.from.email:onboarding@resend.dev}")
    private String resendFrom;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public void sendVerificationOtp(String to, String otp, int minutes) {
        send(to, "Verify your WellNest email", "email verification", otp, minutes);
    }

    public void sendPasswordResetOtp(String to, String otp, int minutes) {
        send(to, "WellNest password reset code", "password reset", otp, minutes);
    }

    private void send(String to, String subject, String purpose, String otp, int minutes) {
        // ALWAYS log the OTP so it appears in the server logs (Render dashboard logs)
        log.info("==========================================================");
        log.info("🔐 WELLNEST OTP for [{}]: {}", to, otp);
        log.info("   Purpose: {} (expires in {} minutes)", purpose, minutes);
        log.info("==========================================================");

        String textContent = "Your WellNest " + purpose + " code is " + otp + ".\n"
                + "It expires in " + minutes + " minutes. "
                + "If you didn't request this, you can ignore this email.";

        // 1. Brevo REST API (100% Free, NO custom domain needed, works with @gmail.com sender on Render)
        if (brevoApiKey != null && !brevoApiKey.isBlank() && brevoSenderEmail != null && !brevoSenderEmail.isBlank()) {
            try {
                sendViaBrevo(to, subject, textContent);
                log.info("Verification email successfully sent via Brevo API to {}", to);
                return;
            } catch (Exception e) {
                log.error("Failed to send email via Brevo API to {}: {}", to, e.getMessage());
            }
        }

        // 2. Resend HTTP API (requires verified domain or sending to own account email via onboarding@resend.dev)
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            try {
                sendViaResend(to, subject, textContent);
                log.info("Verification email successfully sent via Resend API to {}", to);
                return;
            } catch (Exception e) {
                log.error("Failed to send email via Resend API to {}: {}", to, e.getMessage());
            }
        }

        // 3. Fallback to SMTP (JavaMailSender)
        if (from != null && !from.isBlank()) {
            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setFrom(from);
                msg.setTo(to);
                msg.setSubject(subject);
                msg.setText(textContent);
                mailSender.send(msg);
                log.info("Verification email sent via SMTP to {}", to);
            } catch (Exception e) {
                log.error("Failed to send email via SMTP to {}: {}", to, e.getMessage());
                throw e;
            }
        } else {
            log.warn("No active mail provider configured. Check server logs for OTP or enable APP_DEV_MOCK_OTP.");
        }
    }

    private void sendViaBrevo(String to, String subject, String text) throws Exception {
        String payload = String.format(
                "{\"sender\":{\"name\":\"%s\",\"email\":\"%s\"},\"to\":[{\"email\":\"%s\"}],\"subject\":\"%s\",\"textContent\":\"%s\"}",
                escapeJson(brevoSenderName),
                escapeJson(brevoSenderEmail),
                escapeJson(to),
                escapeJson(subject),
                escapeJson(text)
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                .header("api-key", brevoApiKey.trim())
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(10))
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("Brevo API error HTTP " + response.statusCode() + ": " + response.body());
        }
    }

    private void sendViaResend(String to, String subject, String text) throws Exception {
        String payload = String.format(
                "{\"from\":\"%s\",\"to\":[\"%s\"],\"subject\":\"%s\",\"text\":\"%s\"}",
                escapeJson(resendFrom),
                escapeJson(to),
                escapeJson(subject),
                escapeJson(text)
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.resend.com/emails"))
                .header("Authorization", "Bearer " + resendApiKey.trim())
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(10))
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("Resend API error HTTP " + response.statusCode() + ": " + response.body());
        }
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
