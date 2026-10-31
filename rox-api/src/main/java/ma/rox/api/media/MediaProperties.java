package ma.rox.api.media;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bound from {@code rox.upload.*}. {@code dir} is the on-disk root where uploaded
 * media is written; {@code publicPath} is the URL prefix the frontend requests,
 * served straight off disk by {@link ma.rox.api.config.WebConfig}. Records support
 * Spring Boot constructor binding and are auto-discovered via
 * {@code @ConfigurationPropertiesScan}.
 */
@ConfigurationProperties(prefix = "rox.upload")
public record MediaProperties(String dir, String publicPath, long maxSizeBytes) {
  public MediaProperties {
    if (dir == null || dir.isBlank()) dir = "./uploads";
    if (publicPath == null || publicPath.isBlank()) publicPath = "/uploads";
    if (maxSizeBytes <= 0) maxSizeBytes = 5L * 1024 * 1024; // 5 MB
  }
}
