package ma.rox.api.config;

import java.nio.file.Paths;
import ma.rox.api.media.MediaProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Serves uploaded media straight off disk under the configured public path
 * ({@code rox.upload.public-path}, default {@code /uploads/**}). The location uses a
 * {@code file:} prefix so Spring resolves it against the absolute directory rather
 * than the classpath. This only exposes static reads — writes go through
 * {@link ma.rox.api.media.MediaService}.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

  private final MediaProperties props;

  public WebConfig(MediaProperties props) { this.props = props; }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    String dir = Paths.get(props.dir()).toAbsolutePath().normalize().toString();
    String location = "file:" + dir + "/";
    String pattern = props.publicPath().startsWith("/")
        ? props.publicPath() : "/" + props.publicPath();
    registry.addResourceHandler(pattern + "/**").addResourceLocations(location);
  }
}
