package com.wellnest.profile.service;

import com.wellnest.profile.dto.BmiResponse;
import com.wellnest.profile.dto.ProfileRequest;
import com.wellnest.profile.model.Profile;
import com.wellnest.profile.repo.ProfileRepository;
import com.wellnest.profile.web.ApiExceptions.NotFoundException;
import com.wellnest.profile.web.ApiExceptions.ProfileIncompleteException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;

@Service
public class ProfileService {

    private static final Set<String> IMAGE_TYPES = Set.of("image/jpeg", "image/png");

    private final ProfileRepository repo;
    private final ProfileEventPublisher events;
    private final Path uploadDir;

    public ProfileService(ProfileRepository repo, ProfileEventPublisher events,
                          @Value("${profile.upload-dir}") String uploadDir) {
        this.repo = repo;
        this.events = events;
        this.uploadDir = Path.of(uploadDir).toAbsolutePath();
    }

    /** Lazy create: works even before the UserRegistered consumer exists. */
    @Transactional
    public Profile getOrCreate(Long userId) {
        return repo.findByUserId(userId).orElseGet(() -> repo.save(new Profile(userId)));
    }

    @Transactional
    public Profile update(Long userId, ProfileRequest r) {
        Profile p = getOrCreate(userId);
        p.setAge(r.age());
        p.setHeightCm(r.heightCm());
        p.setWeightKg(r.weightKg());
        p.setTargetWeightKg(r.targetWeightKg());
        p.setFitnessGoal(r.fitnessGoal());
        Profile saved = repo.save(p);
        events.profileUpdated(saved);
        return saved;
    }

    @Transactional(readOnly = true)
    public BmiResponse bmi(Long userId) {
        Profile p = repo.findByUserId(userId).orElseThrow(ProfileIncompleteException::new);
        if (p.getHeightCm() == null || p.getWeightKg() == null) throw new ProfileIncompleteException();
        return BmiCalculator.calculate(p.getHeightCm(), p.getWeightKg(), p.getTargetWeightKg(), p.getFitnessGoal());
    }

    @Transactional
    public void saveAvatar(Long userId, MultipartFile file) throws IOException {
        String type = file.getContentType();
        if (file.isEmpty() || type == null || !IMAGE_TYPES.contains(type)) {
            throw new IllegalArgumentException("Upload a JPG or PNG image");
        }
        Files.createDirectories(uploadDir);
        String name = "user-" + userId + (type.equals("image/png") ? ".png" : ".jpg");
        Profile p = getOrCreate(userId);
        if (p.getAvatarFile() != null) Files.deleteIfExists(uploadDir.resolve(p.getAvatarFile()));
        file.transferTo(uploadDir.resolve(name));
        p.setAvatarFile(name);
        p.setAvatarContentType(type);
        repo.save(p);
    }

    public record Avatar(byte[] bytes, String contentType) {}

    @Transactional(readOnly = true)
    public Avatar loadAvatar(Long userId) throws IOException {
        Profile p = repo.findByUserId(userId).orElseThrow(() -> new NotFoundException("No avatar"));
        if (p.getAvatarFile() == null) throw new NotFoundException("No avatar");
        Path f = uploadDir.resolve(p.getAvatarFile());
        if (!Files.exists(f)) throw new NotFoundException("No avatar");
        return new Avatar(Files.readAllBytes(f), p.getAvatarContentType());
    }
}
