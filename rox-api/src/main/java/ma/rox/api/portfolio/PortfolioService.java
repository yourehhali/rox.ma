package ma.rox.api.portfolio;

import static ma.rox.api.common.IdGen.*;

import java.util.ArrayList;
import java.util.List;
import ma.rox.api.error.ApiException;
import ma.rox.api.portfolio.PortfolioDtos.Colors;
import ma.rox.api.portfolio.PortfolioDtos.PortfolioItemDto;
import ma.rox.api.portfolio.PortfolioDtos.PortfolioItemInput;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PortfolioService {

  private final PortfolioRepo repo;

  public PortfolioService(PortfolioRepo repo) { this.repo = repo; }

  public List<PortfolioItemDto> list(boolean onlyPublished) {
    if (onlyPublished) {
      return repo.findPublished(org.springframework.data.domain.Pageable.unpaged()).stream()
          .map(PortfolioService::toDto).toList();
    }
    return repo.findAllOrdered().stream().map(PortfolioService::toDto).toList();
  }

  public PortfolioItemDto one(String id) {
    return toDto(repo.findById(id).orElseThrow(() -> ApiException.notFound("Projet")));
  }

  @Transactional
  public PortfolioItemDto create(PortfolioItemInput in) {
    PortfolioItem p = new PortfolioItem();
    p.setId(prefixed("p"));
    applyInput(p, in);
    if (p.getColorA() == null) p.setColorA("#E31B23");
    if (p.getColorB() == null) p.setColorB("#111827");
    p.setCreatedAt(nowUtc());
    if (p.getTags() == null) p.setTags(new ArrayList<>());
    if (p.getGalleryUrls() == null) p.setGalleryUrls(new ArrayList<>());
    repo.save(p);
    return toDto(p);
  }

  @Transactional
  public PortfolioItemDto update(String id, PortfolioItemInput in) {
    PortfolioItem p = repo.findById(id).orElseThrow(() -> ApiException.notFound("Projet"));
    applyInput(p, in);
    return toDto(repo.save(p));
  }

  @Transactional
  public void delete(String id) {
    if (!repo.existsById(id)) throw ApiException.notFound("Projet");
    repo.deleteById(id);
  }

  @Transactional
  public PortfolioItemDto setPublished(String id, boolean value) {
    PortfolioItem p = repo.findById(id).orElseThrow(() -> ApiException.notFound("Projet"));
    p.setPublished(value);
    return toDto(repo.save(p));
  }

  @Transactional
  public PortfolioItemDto setFeatured(String id, boolean value) {
    PortfolioItem p = repo.findById(id).orElseThrow(() -> ApiException.notFound("Projet"));
    p.setFeatured(value);
    return toDto(repo.save(p));
  }

  private void applyInput(PortfolioItem p, PortfolioItemInput in) {
    if (in.title() != null)    p.setTitle(in.title());
    if (in.client() != null)   p.setClient(in.client());
    if (in.sector() != null)   p.setSector(in.sector());
    if (in.service() != null)  p.setService(in.service());
    if (in.city() != null)     p.setCity(in.city());
    if (in.summary() != null)  p.setSummary(in.summary());
    if (in.result() != null)   p.setResult(in.result());
    if (in.tags() != null)     p.setTags(new ArrayList<>(in.tags()));
    if (in.colors() != null) {
      if (in.colors().a() != null) p.setColorA(in.colors().a());
      if (in.colors().b() != null) p.setColorB(in.colors().b());
    }
    // Media: an explicit empty thumbnail clears it back to the gradient fallback.
    if (in.thumbnailUrl() != null) {
      String t = in.thumbnailUrl().trim();
      p.setThumbnailUrl(t.isEmpty() ? null : t);
    }
    if (in.galleryUrls() != null) {
      List<String> cleaned = in.galleryUrls().stream()
          .filter(u -> u != null && !u.isBlank()).map(String::trim).toList();
      p.setGalleryUrls(new ArrayList<>(cleaned));
    }
    if (in.featured() != null) p.setFeatured(in.featured());
    if (in.published() != null) p.setPublished(in.published());
  }

  public static PortfolioItemDto toDto(PortfolioItem p) {
    return new PortfolioItemDto(
        p.getId(), p.getTitle(), p.getClient(), p.getSector(), p.getService(), p.getCity(),
        p.getSummary(), p.getResult(),
        p.getTags() == null ? List.of() : p.getTags(),
        new Colors(p.getColorA(), p.getColorB()),
        p.getThumbnailUrl(),
        p.getGalleryUrls() == null ? List.of() : p.getGalleryUrls(),
        p.isFeatured(), p.isPublished(), iso(p.getCreatedAt()));
  }
}
