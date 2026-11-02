package com.github.finncull.urlshortener;

import com.github.finncull.urlshortener.model.URLMapping;
import com.github.finncull.urlshortener.repository.URLRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

// Not transactional so each save() commits on its own, the same as in the running app
@DataJpaTest
@Import(TestcontainersConfiguration.class)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
public class URLRepositoryTest {

    @Autowired
    private URLRepository repository;

    @AfterEach
    public void cleanUp(){
        repository.deleteAll();
    }

    @Test
    public void save_doesNotOverwriteExistingShortCode(){
        LocalDateTime expiryDate = LocalDateTime.now().plusDays(1);
        repository.save(new URLMapping("abc123", "https://original.example.com", expiryDate));

        assertThrows(DataIntegrityViolationException.class, () ->
                repository.save(new URLMapping("abc123", "https://other.example.com", expiryDate)));

        assertEquals("https://original.example.com", repository.findById("abc123").orElseThrow().getOriginalUrl());
    }
}
