package com.github.finncull.urlshortener.exception;

public class ShortCodeNotFoundException extends RuntimeException {
    private final String missingCode;

    public ShortCodeNotFoundException(String shortCode){
        super("No mapping found for short code: " + shortCode);
        this.missingCode = shortCode;
    }
}
