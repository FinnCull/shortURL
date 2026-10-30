package com.github.finncull.urlshortener.service;

import com.github.finncull.urlshortener.exception.InvalidUrlException;
import com.github.finncull.urlshortener.exception.LinkExpiredException;
import com.github.finncull.urlshortener.exception.ShortCodeNotFoundException;
import com.github.finncull.urlshortener.model.URLMapping;
import com.github.finncull.urlshortener.repository.URLRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.UnknownHostException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;

@Service
public class URLService {
    private final URLRepository repository;
    private static final int CODELENGTH = 10;
    private static final int MAX_CODE_ATTEMPTS = 5;
    private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private final SecureRandom secureRandom = new SecureRandom();
    private final String appDomain;

    public URLService(URLRepository repository, @Value("${app.domain}") String appDomain){
        this.repository = repository;
        this.appDomain = appDomain;

    }

    public String generateShortCode(int codeLength){
        StringBuilder sb = new StringBuilder(codeLength);
        for (int i =0; i < codeLength; i++){
            int index = secureRandom.nextInt(ALPHABET.length());
            sb.append(ALPHABET.charAt(index));
        }
        return sb.toString();
    }

    public URLMapping handleNewShortURLCreation(String originalURL, LocalDateTime expiryDate){
        validateOriginalUrl(originalURL);
        for (int attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++){
            URLMapping newURLMapping = new URLMapping(generateShortCode(CODELENGTH), originalURL, expiryDate);
            try{
                return repository.save(newURLMapping);
            } catch (DataIntegrityViolationException e){
                // short code already taken, try another
            }
        }
        throw new IllegalStateException("Could not generate a unique short code after " + MAX_CODE_ATTEMPTS + " attempts");
    }

    public String findCorrespondingURL(String shortCode){
        Optional<URLMapping> urlMappingOptional = repository.findById(shortCode);
        URLMapping urlMapping = urlMappingOptional.orElseThrow(() -> new ShortCodeNotFoundException(shortCode));

        if(urlMapping.getExpiryDate().isBefore(LocalDateTime.now())){
            throw new LinkExpiredException(shortCode);
        }
        else{
            return urlMapping.getOriginalUrl();
        }
    }

    private void validateOriginalUrl(String originalUrl){
        URI uri;

        try{
            uri = new URI(originalUrl);
        } catch (URISyntaxException e){
            throw new InvalidUrlException("Malformed URL");
        }

        String host = uri.getHost();
        if(host == null){
            throw new InvalidUrlException("URL has no host");
        }

        host = host.toLowerCase(Locale.ROOT);

        if (host.equals(appDomain)||host.endsWith("." + appDomain)) {
            throw new InvalidUrlException("cannot shorten links to this service");
        }

        InetAddress[] addresses;

        try{
            addresses = InetAddress.getAllByName(host);
        }catch(UnknownHostException e){
            throw new InvalidUrlException("host does not resolve");
        }

        for (InetAddress address : addresses){
            if(isPrivateAddress(address)){
                throw new InvalidUrlException("Url points to a private or internal address");
            }
        }
    }

    private static boolean isPrivateAddress(InetAddress address){
        if(address.isAnyLocalAddress()
            || address.isLoopbackAddress()
            || address.isLinkLocalAddress()
            || address.isSiteLocalAddress()
            || address.isMulticastAddress()){
            return true;
        }

        byte[] bytes = address.getAddress();
        if (bytes.length == 4){
            int first = bytes[0] & 0xFF;
            int second = bytes[1] & 0xFF;
            return first == 0 || (first == 100 && second >= 64 && second <= 127);
        }
        return (bytes[0] & 0xFE) == 0xFC;
    }

}
