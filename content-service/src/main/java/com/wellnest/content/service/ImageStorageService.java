package com.wellnest.content.service;

import com.wellnest.content.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class ImageStorageService {

    private static final Set<String> ALLOWED_EXT = Set.of("jpg", "jpeg", "png", "gif", "webp");
    private static final String URL_PREFIX = "/api/content/uploads/blogs/";

    private final Path blogDir;

    public ImageStorageService(@Value("${content.upload-dir}") String uploadDir) {
        this.blogDir = Paths.get(uploadDir).toAbsolutePath().normalize().resolve("blogs");
    }

    /** Saves the image and returns its public URL path, or null when no file was sent. */
    public String saveBlogImage(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Only image files are allowed");
        }
        String ext = extensionOf(file.getOriginalFilename());
        if (!ALLOWED_EXT.contains(ext)) {
            throw new BadRequestException("Allowed image types: " + ALLOWED_EXT);
        }

        String fileName = UUID.randomUUID() + "." + ext; // never trust the client's file name
        try {
            Files.createDirectories(blogDir);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, blogDir.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new UncheckedIOException("Could not store image", e);
        }
        return URL_PREFIX + fileName;
    }

    private static String extensionOf(String name) {
        if (name == null || !name.contains(".")) return "";
        return name.substring(name.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }
}
