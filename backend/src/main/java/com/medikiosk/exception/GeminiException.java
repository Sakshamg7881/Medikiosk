package com.medikiosk.exception;

public class GeminiException extends RuntimeException {

    private final int statusCode;

    public GeminiException(String message) {
        super(message);
        this.statusCode = 500;
    }

    public GeminiException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public GeminiException(String message, Throwable cause) {
        super(message, cause);
        this.statusCode = 500;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
