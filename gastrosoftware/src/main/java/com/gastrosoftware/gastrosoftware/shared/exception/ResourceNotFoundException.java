package com.gastrosoftware.gastrosoftware.shared.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resource, Long id) {
        super("%s no encontrado con id: %d".formatted(resource, id));
    }

    public ResourceNotFoundException(String resource, String field, String value) {
        super("%s no encontrado con %s: %s".formatted(resource, field, value));
    }
}
