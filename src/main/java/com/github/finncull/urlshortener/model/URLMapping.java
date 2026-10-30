package com.github.finncull.urlshortener.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Transient;
import org.springframework.data.domain.Persistable;

import java.time.LocalDateTime;

@Entity
@Table(name = "url_mapping")
public class URLMapping implements Persistable<String> {

    protected URLMapping(){

    }

    public URLMapping(String shortCode, String originalURL, LocalDateTime expiryDate){
        this.shortCode = shortCode;
        this.originalUrl = originalURL;
        this.expiryDate = expiryDate;

        this.createdDate = LocalDateTime.now();
    }

    @Id
    @Column(length = 10)
    private String shortCode;
    @Column(length = 2048)
    private String originalUrl;
    private LocalDateTime createdDate;
    private LocalDateTime expiryDate;

    // shortCode is assigned by us, so without this save() would merge and silently overwrite an existing row
    @Transient
    private boolean isNew = true;

    @Override
    public String getId(){
        return this.shortCode;
    }

    @Override
    public boolean isNew(){
        return this.isNew;
    }

    @PostLoad
    @PostPersist
    void markNotNew(){
        this.isNew = false;
    }

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
