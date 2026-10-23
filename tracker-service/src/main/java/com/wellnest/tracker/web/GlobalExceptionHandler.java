package com.wellnest.tracker.web;

import com.wellnest.tracker.web.ApiExceptions.ConflictException;
import com.wellnest.tracker.web.ApiExceptions.NotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/** Error shape: {timestamp, status, error, message, path} - same as profile-service. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private ResponseEntity<Map<String, Object>> build(HttpStatus s, String msg, HttpServletRequest req) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now());
        body.put("status", s.value());
        body.put("error", s.getReasonPhrase());
        body.put("message", msg);
        body.put("path", req.getRequestURI());
        return ResponseEntity.status(s).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, Object>> invalid(MethodArgumentNotValidException e, HttpServletRequest r) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + " " + f.getDefaultMessage()).collect(Collectors.joining("; "));
        return build(HttpStatus.BAD_REQUEST, msg, r);
    }

    @ExceptionHandler({IllegalArgumentException.class, MissingRequestHeaderException.class})
    ResponseEntity<Map<String, Object>> badRequest(Exception e, HttpServletRequest r) {
        return build(HttpStatus.BAD_REQUEST, e.getMessage(), r);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<Map<String, Object>> unreadable(HttpMessageNotReadableException e, HttpServletRequest r) {
        return build(HttpStatus.BAD_REQUEST, "Malformed JSON or invalid value (check dates as yyyy-MM-dd and enum names)", r);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<Map<String, Object>> badParam(MethodArgumentTypeMismatchException e, HttpServletRequest r) {
        return build(HttpStatus.BAD_REQUEST, "Invalid value for '" + e.getName() + "'", r);
    }

    @ExceptionHandler(NotFoundException.class)
    ResponseEntity<Map<String, Object>> notFound(NotFoundException e, HttpServletRequest r) {
        return build(HttpStatus.NOT_FOUND, e.getMessage(), r);
    }

    @ExceptionHandler(ConflictException.class)
    ResponseEntity<Map<String, Object>> conflict(ConflictException e, HttpServletRequest r) {
        return build(HttpStatus.CONFLICT, e.getMessage(), r);
    }
}
