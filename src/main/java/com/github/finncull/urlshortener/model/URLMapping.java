package com.github.finncull.urlshortener.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.time.LocalDateTime;

@Entity
public class URLMapping {

    protected URLMapping(){

    }

    public URLMapping(String shortCode, String originalURL, LocalDateTime expiryDate){
        this.shortCode = shortCode;
        this.originalUrl = originalURL;
        this.expiryDate = expiryDate;

        this.createdDate = LocalDateTime.now();
    }

    @Id
    private String shortCode;
    private String originalUrl;
    private LocalDateTime createdDate;
    private LocalDateTime expiryDate;

    public String getShortCode(){
        return this.shortCode;
    }

    public String getOriginalUrl(){
        return this.originalUrl;
    }

    public LocalDateTime getCreatedDate(){
        return this.createdDate;
    }

    public LocalDateTime getExpiryDate(){
        return this.expiryDate;
    }

    public void setExpiryDate(LocalDateTime newExpiryDate){
        this.expiryDate = newExpiryDate;
    }
}
