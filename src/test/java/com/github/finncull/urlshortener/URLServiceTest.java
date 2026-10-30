package com.github.finncull.urlshortener;

import com.github.finncull.urlshortener.exception.InvalidUrlException;
import com.github.finncull.urlshortener.exception.LinkExpiredException;
import com.github.finncull.urlshortener.exception.ShortCodeNotFoundException;
import com.github.finncull.urlshortener.model.URLMapping;
import com.github.finncull.urlshortener.repository.URLRepository;
import com.github.finncull.urlshortener.service.URLService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class URLServiceTest {

    private static final String APP_DOMAIN = "short.example.com";

    @Test
    public void testExpiredLinkException(){
        URLRepository repo = Mockito.mock(URLRepository.class);
        LocalDateTime expiryDate = LocalDateTime.now().minusDays(1);
        URLMapping expiredMapping = new URLMapping("abc123","www.example.com", expiryDate);
        URLService service = new URLService(repo, APP_DOMAIN);

        when(repo.findById("abc123")).thenReturn(Optional.of(expiredMapping));

        assertThrows(LinkExpiredException.class, () -> {
            service.findCorrespondingURL("abc123");
        });
    }

    @Test
    public void findCorrespondingUrl_returnsUrlWhenActive(){
        URLRepository repo = Mockito.mock(URLRepository.class);
        LocalDateTime expiryDate = LocalDateTime.now().plusDays(1);
        URLMapping activeMapping = new URLMapping("abc123","www.example.com", expiryDate);
        URLService service = new URLService(repo, APP_DOMAIN);

        when(repo.findById("abc123")).thenReturn(Optional.of(activeMapping));

        assertEquals("www.example.com", service.findCorrespondingURL("abc123"));
    }

    @Test
    public void findCorrespondingURL_throwsWhenCodeMissing(){
        URLRepository repo = Mockito.mock(URLRepository.class);
        URLService service = new URLService(repo, APP_DOMAIN);

        assertThrows(ShortCodeNotFoundException.class, () -> {
            service.findCorrespondingURL("abc123");
        });
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "http://0.0.0.0/",              // any-local
            "http://127.0.0.1/",            // loopback
            "http://169.254.169.254/",      // link-local (cloud metadata)
            "http://10.0.0.1/",             // site-local 10/8
            "http://172.16.0.1/",           // site-local 172.16/12 lower bound
            "http://172.31.255.255/",       // site-local 172.16/12 upper bound
            "http://192.168.1.1/",          // site-local 192.168/16
            "http://224.0.0.1/",            // multicast
            "http://0.1.2.3/",              // 0.0.0.0/8
            "http://100.64.0.0/",           // CGNAT lower bound
            "http://100.127.255.255/",      // CGNAT upper bound
            "http://[::]/",                 // IPv6 any-local
            "http://[::1]/",                // IPv6 loopback
            "http://[fe80::1]/",            // IPv6 link-local
            "http://[ff02::1]/",            // IPv6 multicast
            "http://[fc00::1]/",            // IPv6 unique local fc00::/7
            "http://[fdff:ffff::1]/"        // IPv6 unique local fd..
    })
    public void handleNewShortURLCreation_rejectsPrivateAddresses(String url){
        URLRepository repo = Mockito.mock(URLRepository.class);
        URLService service = new URLService(repo, APP_DOMAIN);

        InvalidUrlException ex = assertThrows(InvalidUrlException.class, () ->
                service.handleNewShortURLCreation(url, LocalDateTime.now().plusDays(1)));
        assertEquals("Url points to a private or internal address", ex.getMessage());
        verify(repo, never()).save(any());
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "http://8.8.8.8/",              // public IPv4
            "http://172.15.255.255/",       // just below 172.16/12
            "http://172.32.0.0/",           // just above 172.16/12
            "http://100.63.255.255/",       // just below CGNAT
            "http://100.128.0.0/",          // just above CGNAT
            "http://1.0.0.0/",              // just above 0.0.0.0/8
            "http://[2001:4860:4860::8888]/", // public IPv6
            "http://[fb00::1]/",            // just below fc00::/7
            "http://[fe00::1]/"             // just above fc00::/7, below link-local
    })
    public void handleNewShortURLCreation_allowsPublicAddresses(String url){
        URLRepository repo = Mockito.mock(URLRepository.class);
        URLService service = new URLService(repo, APP_DOMAIN);
        when(repo.save(any(URLMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        URLMapping mapping = service.handleNewShortURLCreation(url, LocalDateTime.now().plusDays(1));

        assertEquals(url, mapping.getOriginalUrl());
        verify(repo).save(any(URLMapping.class));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "http://short.example.com/abc",
            "http://SHORT.EXAMPLE.COM/abc",
            "http://api.short.example.com/abc"
    })
    public void handleNewShortURLCreation_rejectsOwnDomain(String url){
        URLRepository repo = Mockito.mock(URLRepository.class);
        URLService service = new URLService(repo, APP_DOMAIN);

        assertThrows(InvalidUrlException.class, () ->
                service.handleNewShortURLCreation(url, LocalDateTime.now().plusDays(1)));
    }

    @Test
    public void handleNewShortURLCreation_rejectsMalformedUrl(){
        URLRepository repo = Mockito.mock(URLRepository.class);
        URLService service = new URLService(repo, APP_DOMAIN);

        InvalidUrlException ex = assertThrows(InvalidUrlException.class, () ->
                service.handleNewShortURLCreation("http://exa mple.com", LocalDateTime.now().plusDays(1)));
        assertEquals("Malformed URL", ex.getMessage());
    }

    @Test
    public void handleNewShortURLCreation_rejectsUrlWithoutHost(){
        URLRepository repo = Mockito.mock(URLRepository.class);
        URLService service = new URLService(repo, APP_DOMAIN);

        InvalidUrlException ex = assertThrows(InvalidUrlException.class, () ->
                service.handleNewShortURLCreation("www.example.com", LocalDateTime.now().plusDays(1)));
        assertEquals("URL has no host", ex.getMessage());
    }

    @Test
    public void handleNewShortURLCreation_retriesWithNewCodeOnCollision(){
        URLRepository repo = Mockito.mock(URLRepository.class);
        URLService service = new URLService(repo, APP_DOMAIN);
        when(repo.save(any(URLMapping.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key"))
                .thenAnswer(inv -> inv.getArgument(0));

        URLMapping mapping = service.handleNewShortURLCreation("http://8.8.8.8/", LocalDateTime.now().plusDays(1));

        ArgumentCaptor<URLMapping> captor = ArgumentCaptor.forClass(URLMapping.class);
        verify(repo, times(2)).save(captor.capture());
        assertNotEquals(captor.getAllValues().get(0).getShortCode(), captor.getAllValues().get(1).getShortCode());
        assertEquals(captor.getAllValues().get(1).getShortCode(), mapping.getShortCode());
    }

    @Test
    public void handleNewShortURLCreation_givesUpAfterRepeatedCollisions(){
        URLRepository repo = Mockito.mock(URLRepository.class);
        URLService service = new URLService(repo, APP_DOMAIN);
        when(repo.save(any(URLMapping.class))).thenThrow(new DataIntegrityViolationException("duplicate key"));

        assertThrows(IllegalStateException.class, () ->
                service.handleNewShortURLCreation("http://8.8.8.8/", LocalDateTime.now().plusDays(1)));
        verify(repo, times(5)).save(any(URLMapping.class));
    }
}
