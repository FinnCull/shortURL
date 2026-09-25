package com.github.finncull.urlshortener.controller;

import com.github.finncull.urlshortener.dto.CreateUrlRequest;
import com.github.finncull.urlshortener.service.URLService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.net.URI;

@Controller
public class URLController {

    private final URLService service;
    private final String baseUrl;

    public URLController(URLService service, @Value("${app.base-url}") String baseUrl){
        this.service = service;
        this.baseUrl = baseUrl;
    }

    @GetMapping("/{shortCode}")
    public ResponseEntity<Void> redirectToOriginalURL(@PathVariable String shortCode){
        String url = service.findCorrespondingURL(shortCode);
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }

    @PostMapping("/createURL")
    public ResponseEntity<String> createShortURL(@Valid @RequestBody CreateUrlRequest request){
        String shortCode = service.handleNewShortURLCreation(request.originalUrl(),request.expiryDate()).getShortCode();
        String shortUrl = baseUrl + shortCode;
        return ResponseEntity.status(HttpStatus.CREATED).location(URI.create(shortUrl)).body(shortUrl);
    }



}
