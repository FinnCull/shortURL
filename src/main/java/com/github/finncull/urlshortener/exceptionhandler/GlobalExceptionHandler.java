package com.github.finncull.urlshortener.exceptionhandler;
import com.github.finncull.urlshortener.exception.InvalidUrlException;
import com.github.finncull.urlshortener.exception.LinkExpiredException;
import com.github.finncull.urlshortener.exception.ShortCodeNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.List;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler
    public ResponseEntity<String> handleShortURLNotFound(ShortCodeNotFoundException exception){
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(exception.getMessage());
    }

    @ExceptionHandler
    public ResponseEntity<String> handleLinkExpired(LinkExpiredException exception){
        return ResponseEntity.status(HttpStatus.GONE).body(exception.getMessage());
    }

    public record FieldErrorResponse(String field, String message) {}
    public record ValidationErrorResponse(List<FieldErrorResponse> errors) {}

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<FieldErrorResponse> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> new FieldErrorResponse(fieldError.getField(), fieldError.getDefaultMessage()))
                .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ValidationErrorResponse(errors));
    }

    @ExceptionHandler
    public ResponseEntity<ValidationErrorResponse> handleInvalidUrl(InvalidUrlException exception){
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ValidationErrorResponse(List.of(new FieldErrorResponse("originalUrl",exception.getMessage()))));
    }
}
