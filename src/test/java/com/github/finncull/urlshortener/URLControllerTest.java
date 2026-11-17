package com.github.finncull.urlshortener;

import com.github.finncull.urlshortener.controller.URLController;
import com.github.finncull.urlshortener.exception.InvalidUrlException;
import com.github.finncull.urlshortener.exception.LinkExpiredException;
import com.github.finncull.urlshortener.exception.ShortCodeNotFoundException;
import com.github.finncull.urlshortener.model.URLMapping;
import com.github.finncull.urlshortener.service.URLService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(URLController.class)
public class URLControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private URLService urlService;

    @Test
    void redirect_returns404WhenCodeMissing() throws Exception {
        when(urlService.findCorrespondingURL("abc123")).thenThrow(new ShortCodeNotFoundException("abc123"));

        mockMvc.perform(get("/abc123"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.title").value("Not Found"))
                .andExpect(jsonPath("$.detail").value(containsString("abc123")))
                .andExpect(jsonPath("$.instance").value("/abc123"));
    }

    @Test
    void redirect_returns410WhenExpired() throws Exception {
        when(urlService.findCorrespondingURL("abc123")).thenThrow(new LinkExpiredException("abc123"));

        mockMvc.perform(get("/abc123"))
                .andExpect(status().isGone())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(410))
                .andExpect(jsonPath("$.detail").value("This link has expired - abc123"));
    }

    @Test
    void redirect_returns302WithLocationWhenActive() throws Exception {
        when(urlService.findCorrespondingURL("abc123")).thenReturn("https://www.example.com");

        mockMvc.perform(get("/abc123"))
                .andExpect(status().isFound())
                .andExpect(redirectedUrl("https://www.example.com"));
    }

    @Test
    void create_returns400WhenInvalidOriginalUrl() throws Exception {
        String tomorrowDate = LocalDateTime.now().plusDays(1).toString();
        String body = """
                {
                   "originalUrl": "http://example.com",
                   "expiryDate": "%s"
                }
                """.formatted(tomorrowDate);
        mockMvc.perform(post("/api/links")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors.length()").value(1))
                .andExpect(jsonPath("$.errors[0].field").value("originalUrl"))
                .andExpect(jsonPath("$.errors[0].message").value("must be a valid https:// URL"));
    }

    @Test
    void create_returns400WhenServiceRejectsUrl() throws Exception {
        String tomorrowDate = LocalDateTime.now().plusDays(1).toString();
        String body = """
                {
                   "originalUrl": "https://10.0.0.1",
                   "expiryDate": "%s"
                }
                """.formatted(tomorrowDate);
        when(urlService.handleNewShortURLCreation(eq("https://10.0.0.1"), any(LocalDateTime.class)))
                .thenThrow(new InvalidUrlException("Url points to a private or internal address"));

        mockMvc.perform(post("/api/links")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors.length()").value(1))
                .andExpect(jsonPath("$.errors[0].field").value("originalUrl"))
                .andExpect(jsonPath("$.errors[0].message").value("Url points to a private or internal address"));
    }

    @Test
    void create_returns400WhenExpiryDateIsInThePast() throws Exception {
        String yesterday = LocalDateTime.now().minusDays(1).toString();
        String body = """
                {
                   "originalUrl": "https://www.example.com",
                   "expiryDate": "%s"
                }
                """.formatted(yesterday);

        mockMvc.perform(post("/api/links")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.errors.length()").value(1))
                .andExpect(jsonPath("$.errors[0].field").value("expiryDate"))
                .andExpect(jsonPath("$.errors[0].message").value("must be a future date"));
        verifyNoInteractions(urlService);
    }

    @Test
    void create_returns400WhenBodyIsUnreadable() throws Exception {
        String body = """
                {
                   "originalUrl": "https://www.example.com",
                   "expiryDate": "not-a-date"
                }
                """;

        mockMvc.perform(post("/api/links")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void create_returns500WithoutLeakingInternalsWhenUnexpectedErrorOccurs() throws Exception {
        String body = """
                {
                   "originalUrl": "https://www.example.com",
                   "expiryDate": "%s"
                }
                """.formatted(LocalDateTime.now().plusDays(1));
        when(urlService.handleNewShortURLCreation(eq("https://www.example.com"), any(LocalDateTime.class)))
                .thenThrow(new IllegalStateException("Could not generate a unique short code after 3 attempts"));

        mockMvc.perform(post("/api/links")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail").value("An unexpected error occurred"));
    }

    @Test
    void create_returns201WithLinkJsonAndLocationOfApiResource() throws Exception {
        LocalDateTime expiry = LocalDateTime.of(2030, 1, 1, 12, 0);
        String body = """
                {
                   "originalUrl": "https://www.example.com",
                   "expiryDate": "%s"
                }
                """.formatted(expiry);
        when(urlService.handleNewShortURLCreation(eq("https://www.example.com"), any(LocalDateTime.class)))
                .thenReturn(new URLMapping("abc1234", "https://www.example.com", expiry));

        mockMvc.perform(post("/api/links")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/api/links/abc1234"))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.shortCode").value("abc1234"))
                .andExpect(jsonPath("$.shortUrl").value("http://localhost:8080/abc1234"))
                .andExpect(jsonPath("$.originalUrl").value("https://www.example.com"))
                .andExpect(jsonPath("$.expiryDate").value("2030-01-01T12:00:00"));
    }
}
