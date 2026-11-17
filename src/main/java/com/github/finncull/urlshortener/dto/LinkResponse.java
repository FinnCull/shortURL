package com.github.finncull.urlshortener.dto;

import java.time.LocalDateTime;

public record LinkResponse(
        String shortCode,
        String shortUrl,
        String originalUrl,
        LocalDateTime expiryDate) {
}
