package com.github.finncull.urlshortener.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.hibernate.validator.constraints.URL;

import java.time.LocalDateTime;

public record CreateUrlRequest(
        @NotBlank @URL( protocol = "https", message =  "must be a valid https:// URL") String originalUrl,
        @Future @NotNull LocalDateTime expiryDate) {
}
