package com.github.finncull.urlshortener.exception;

public class InvalidUrlException extends RuntimeException{
    public InvalidUrlException(String message){
        super(message);
    }
}
