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
import static org.mockito.ArgumentMatchers.isNull;
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
                .andExpect(content().string(containsString("abc123")));
    }

    @Test
    void redirect_returns410WhenExpired() throws Exception {
        when(urlService.findCorrespondingURL("abc123")).thenThrow(new LinkExpiredException("abc123"));

        mockMvc.perform(get("/abc123"))
                .andExpect(status().isGone())
                .andExpect(content().string("This link has expired - abc123"));
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
        mockMvc.perform(post("/createURL")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
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

        mockMvc.perform(post("/createURL")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.length()").value(1))
                .andExpect(jsonPath("$.errors[0].field").value("originalUrl"))
                .andExpect(jsonPath("$.errors[0].message").value("Url points to a private or internal address"));
    }

    @Test
    void create_returns201WithShortUrl() throws Exception {
        LocalDateTime tomorrow = LocalDateTime.now().plusDays(1);
        String body = """
                {
                   "originalUrl": "https://www.example.com",
                   "expiryDate": "%s"
                }
                """.formatted(tomorrow);
        when(urlService.handleNewShortURLCreation(eq("https://www.example.com"), any(LocalDateTime.class)))
                .thenReturn(new URLMapping("abc1234", "https://www.example.com", tomorrow));

        mockMvc.perform(post("/createURL")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost:8080/abc1234"))
                .andExpect(content().string("http://localhost:8080/abc1234"));
    }

    @Test
    void create_returns201WhenExpiryOmitted() throws Exception {
        String body = """
                {
                   "originalUrl": "https://www.example.com"
                }
                """;
        when(urlService.handleNewShortURLCreation(eq("https://www.example.com"), isNull()))
                .thenReturn(new URLMapping("abc1234", "https://www.example.com", null));

        mockMvc.perform(post("/createURL")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(content().string("http://localhost:8080/abc1234"));
    }
}
