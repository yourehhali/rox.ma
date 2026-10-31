package ma.rox.api.media;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import ma.rox.api.error.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Persists uploaded images on disk under {@code rox.upload.dir} and returns the
 * public path the frontend requests (served by {@link ma.rox.api.config.WebConfig}).
 * Deliberately storage-only: it never touches the DB. Callers attach the returned
 * path to an entity (e.g. a portfolio item) on their own save. Files are given an
 * opaque UUID name so the original filename can never be used to path-traverse.
 */
@Service
public class MediaService {

  /** Extension whitelist for web-safe, generally-supported raster images. */
  private static final Set<String> ALLOWED_EXT = Set.of("jpg", "jpeg", "png", "webp", "avif", "gif");

  private final MediaProperties props;
  private final Path root;

  public MediaService(MediaProperties props) {
    this.props = props;
    this.root = Paths.get(props.dir()).toAbsolutePath().normalize();
  }

  /**
   * Store an image under {@code subdir} and return its public URL path
   * (e.g. {@code /uploads/portfolio/ab12….webp}). Validates content type, extension
   * and size; rejects anything else.
   */
  public String store(MultipartFile file, String subdir) {
    if (file == null || file.isEmpty()) throw ApiException.badRequest("Aucun fichier reçu.");
    if (file.getSize() > props.maxSizeBytes()) {
      throw ApiException.badRequest(
          "Fichier trop volumineux (max " + (props.maxSizeBytes() / (1024 * 1024)) + " Mo).");
    }
    String ct = file.getContentType();
    if (ct == null || !ct.toLowerCase(Locale.ROOT).startsWith("image/")) {
      throw ApiException.badRequest("Seules les images sont acceptées.");
    }
    String ext = extensionOf(file.getOriginalFilename());
    if (!ALLOWED_EXT.contains(ext)) {
      throw ApiException.badRequest("Format d'image non supporté (jpg, png, webp, avif, gif).");
    }

    String folder = sanitizeFolder(subdir);
    String fileName = UUID.randomUUID().toString().replace("-", "") + "." + ext;
    try {
      Path dir = root.resolve(folder);
      Files.createDirectories(dir);
      Path target = dir.resolve(fileName);
      try (InputStream in = file.getInputStream()) {
        Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
      }
      return props.publicPath() + "/" + folder + "/" + fileName;
    } catch (IOException ex) {
      throw new ApiException(500, ma.rox.api.error.ErrorCode.internal_error,
          "Échec de l'enregistrement du fichier.", java.util.List.of());
    }
  }

  /** Lowercased extension after the last dot, or empty string when there is none. */
  private static String extensionOf(String name) {
    if (name == null) return "";
    int dot = name.lastIndexOf('.');
    if (dot < 0 || dot == name.length() - 1) return "";
    return name.substring(dot + 1).toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
  }

  /** Restrict the subfolder to a safe token; anything odd falls back to "misc". */
  private static String sanitizeFolder(String subdir) {
    if (subdir == null) return "misc";
    String s = subdir.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9-]", "");
    return s.isBlank() ? "misc" : s;
  }
}
