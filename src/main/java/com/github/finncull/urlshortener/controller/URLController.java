package com.github.finncull.urlshortener.controller;

import com.github.finncull.urlshortener.dto.CreateUrlRequest;
import com.github.finncull.urlshortener.dto.LinkResponse;
import com.github.finncull.urlshortener.model.URLMapping;
import com.github.finncull.urlshortener.service.URLService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
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

    @GetMapping("/api/links/{shortCode}")
    public ResponseEntity<LinkResponse> getLink(@PathVariable String shortCode){
        return ResponseEntity.ok(toResponse(service.findLink(shortCode)));
    }

    @PostMapping("/api/links")
    public ResponseEntity<LinkResponse> createLink(@Valid @RequestBody CreateUrlRequest request){
        URLMapping mapping = service.handleNewShortURLCreation(request.originalUrl(), request.expiryDate());
        // Location identifies the created API resource; the short URL people share is in the body.
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{shortCode}")
                .buildAndExpand(mapping.getShortCode())
                .toUri();
        return ResponseEntity.created(location).body(toResponse(mapping));
    }

    private LinkResponse toResponse(URLMapping mapping){
        return new LinkResponse(
                mapping.getShortCode(),
                baseUrl + mapping.getShortCode(),
                mapping.getOriginalUrl(),
                mapping.getExpiryDate());
    }
}
