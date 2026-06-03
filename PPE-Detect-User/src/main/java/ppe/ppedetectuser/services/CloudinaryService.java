package ppe.ppedetectuser.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String uploadViolationImage(String imageSource) {
        if (imageSource == null || imageSource.trim().isEmpty()) {
            return null;
        }

        try {
            Map<String, Object> options = ObjectUtils.asMap(
                    "folder", "ppe_violations",
                    "resource_type", "image"
            );

            Map<?, ?> uploadResult;

            if (imageSource.startsWith("data:image")) {
                uploadResult = cloudinary.uploader().upload(imageSource, options);
            } else {
                uploadResult = cloudinary.uploader().upload(imageSource, options);
            }

            return (String) uploadResult.get("secure_url");

        } catch (IOException e) {
            System.err.println("Error uploading image to Cloudinary: " + e.getMessage());
            return null;
        }
    }
}