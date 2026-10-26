package ma.rox.api.content;

import static ma.rox.api.common.IdGen.*;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.*;
import ma.rox.api.content.ContentDtos.*;
import ma.rox.api.error.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContentService {

  private final ServiceRepo services;
  private final PlanRepo plans;
  private final FaqRepo faqs;
  private final SiteInfoRepo info;

  @PersistenceContext private EntityManager em;

  public ContentService(ServiceRepo services, PlanRepo plans, FaqRepo faqs, SiteInfoRepo info) {
    this.services = services;
    this.plans = plans;
    this.faqs = faqs;
    this.info = info;
  }

  // ---------- Services ----------

  public List<ServiceDto> listServices(boolean onlyPublished) {
    var list = onlyPublished ? services.findByPublishedTrueOrderByPositionAsc()
                             : services.findAllByOrderByPositionAsc();
    return list.stream().map(ContentService::toDto).toList();
  }

  public ServiceDto getService(String id) {
    return toDto(services.findById(id).orElseThrow(() -> ApiException.notFound("Service")));
  }

  public ServiceDto getServiceBySlug(String slug) {
    return services.findBySlug(slug).map(ContentService::toDto)
        .orElseThrow(() -> ApiException.notFound("Service"));
  }

  @Transactional
  public ServiceDto createService(ServiceInput in) {
    String slug = slugify(in.slug() != null && !in.slug().isBlank() ? in.slug() : in.name());
    if (services.existsBySlug(slug)) throw ApiException.conflict("Ce slug existe déjà : " + slug);
    CatalogService s = new CatalogService();
    s.setId(prefixed("s"));
    s.setSlug(slug);
    s.setPosition((int) services.count());
    applyService(s, in);
    services.save(s);
    return toDto(s);
  }

  @Transactional
  public ServiceDto updateService(String id, ServiceInput in) {
    CatalogService s = services.findById(id).orElseThrow(() -> ApiException.notFound("Service"));
    if (in.slug() != null && !in.slug().isBlank()) {
      String slug = slugify(in.slug());
      if (!slug.equals(s.getSlug()) && services.existsBySlug(slug)) {
        throw ApiException.conflict("Ce slug existe déjà : " + slug);
      }
      s.setSlug(slug);
    }
    applyService(s, in);
    return toDto(services.save(s));
  }

  @Transactional
  public void deleteService(String id) {
    if (!services.existsById(id)) throw ApiException.notFound("Service");
    services.deleteById(id);
  }

  @Transactional
  public ServiceDto setServicePublished(String id, boolean published) {
    CatalogService s = services.findById(id).orElseThrow(() -> ApiException.notFound("Service"));
    s.setPublished(published);
    return toDto(services.save(s));
  }

  /**
   * Merge semantics: null fields in the incoming DTO mean "leave existing value alone".
   * Non-null scalar fields overwrite. Non-null list fields (points, extras) replace atomically.
   * For a fresh service (id is new), defaults are applied at the end.
   */
  private void applyService(CatalogService s, ServiceInput in) {
    if (in.name() != null) s.setName(in.name());
    if (in.tag() != null) s.setTag(in.tag());
    if (in.icon() != null) s.setIcon(in.icon());
    if (in.shortDesc() != null) s.setShortDesc(in.shortDesc());
    if (in.faqKey() != null) s.setFaqKey(in.faqKey());
    if (in.published() != null) s.setPublished(in.published());

    ServicePageDto p = in.page();
    if (p != null) {
      if (p.eyebrow() != null) s.setEyebrow(p.eyebrow());
      if (p.title() != null) s.setTitle(p.title());
      if (p.lead() != null) s.setLead(p.lead());
      if (p.heading() != null) s.setHeading(p.heading());
      if (p.subtext() != null) s.setSubtext(p.subtext());
      if (p.priceLabel() != null) s.setPriceLabel(p.priceLabel());
      if (p.priceValue() != null) s.setPriceValue(p.priceValue());
      if (p.points() != null) s.setPoints(new ArrayList<>(p.points()));
      if (p.extras() != null) {
        s.getExtras().clear();
        em.flush();
        int i = 0;
        for (ServiceExtraDto x : p.extras()) {
          ServiceExtra e = new ServiceExtra();
          e.setId(prefixed("x"));
          e.setService(s);
          e.setTitle(nz(x.title()));
          e.setText(nz(x.text()));
          e.setPosition(i++);
          s.getExtras().add(e);
        }
      }
    }
    // Defaults for freshly created services.
    if (s.getName() == null) s.setName("");
    if (s.getTag() == null) s.setTag("");
    if (s.getIcon() == null) s.setIcon("Globe");
    if (s.getShortDesc() == null) s.setShortDesc("");
    if (s.getFaqKey() == null) s.setFaqKey("general");
    if (s.getEyebrow() == null) s.setEyebrow("Service");
    if (s.getTitle() == null) s.setTitle("");
    if (s.getLead() == null) s.setLead("");
    if (s.getHeading() == null) s.setHeading("");
    if (s.getSubtext() == null) s.setSubtext("");
    if (s.getPriceLabel() == null) s.setPriceLabel("");
    if (s.getPriceValue() == null) s.setPriceValue("");
    if (s.getPoints() == null) s.setPoints(new ArrayList<>());
  }

  public static ServiceDto toDto(CatalogService s) {
    ServicePageDto page = new ServicePageDto(
        s.getEyebrow(), s.getTitle(), s.getLead(), s.getHeading(), s.getSubtext(),
        s.getPoints() == null ? List.of() : s.getPoints(),
        s.getExtras().stream().map(x -> new ServiceExtraDto(x.getTitle(), x.getText())).toList(),
        s.getPriceLabel(), s.getPriceValue());
    return new ServiceDto(s.getId(), s.getSlug(), s.getName(), s.getTag(), s.getIcon(),
        s.getShortDesc(), s.getFaqKey(), s.isPublished(), page);
  }

  // ---------- Plans ----------

  public List<PlanDto> listPlans() {
    return plans.findAllByOrderByPositionAsc().stream().map(ContentService::toDto).toList();
  }

  public PlanDto getPlan(String id) {
    return toDto(plans.findById(id).orElseThrow(() -> ApiException.notFound("Offre")));
  }

  @Transactional
  public PlanDto createPlan(PlanInput in) {
    Plan p = new Plan();
    p.setId(prefixed("pl"));
    p.setPosition((int) plans.count());
    applyPlan(p, in);
    plans.save(p);
    return toDto(p);
  }

  @Transactional
  public PlanDto updatePlan(String id, PlanInput in) {
    Plan p = plans.findById(id).orElseThrow(() -> ApiException.notFound("Offre"));
    applyPlan(p, in);
    return toDto(plans.save(p));
  }

  @Transactional
  public void deletePlan(String id) {
    if (!plans.existsById(id)) throw ApiException.notFound("Offre");
    plans.deleteById(id);
  }

  private void applyPlan(Plan p, PlanInput in) {
    if (in.name() != null) p.setName(in.name());
    if (in.price() != null) p.setPrice(in.price());
    if (in.unit() != null) p.setUnit(in.unit());
    if (in.description() != null) p.setDescription(in.description());
    if (in.features() != null) p.setFeatures(new ArrayList<>(in.features()));
    if (in.highlight() != null) p.setHighlight(in.highlight());
    // Defaults for freshly created plans.
    if (p.getName() == null) p.setName("");
    if (p.getPrice() == null) p.setPrice("");
    if (p.getUnit() == null) p.setUnit("");
    if (p.getDescription() == null) p.setDescription("");
    if (p.getFeatures() == null) p.setFeatures(new ArrayList<>());
  }

  public static PlanDto toDto(Plan p) {
    return new PlanDto(p.getId(), p.getName(), p.getPrice(), p.getUnit(), p.getDescription(),
        p.getFeatures() == null ? List.of() : p.getFeatures(), p.isHighlight());
  }

  // ---------- FAQ ----------

  public Map<String, List<FaqItemDto>> allFaqs() {
    Map<String, List<FaqItemDto>> out = new LinkedHashMap<>();
    for (FaqGroup g : faqs.findAllByOrderByPositionAsc()) {
      out.put(g.getName(), g.getItems().stream().map(x -> new FaqItemDto(x.q(), x.a())).toList());
    }
    return out;
  }

  public List<FaqItemDto> oneFaq(String group) {
    return faqs.findById(group).map(g -> g.getItems().stream().map(x -> new FaqItemDto(x.q(), x.a())).toList())
        .orElseThrow(() -> ApiException.notFound("Groupe FAQ"));
  }

  @Transactional
  public List<FaqItemDto> replaceFaq(String group, List<FaqItemDto> items) {
    FaqGroup g = faqs.findById(group).orElseGet(() -> {
      FaqGroup ng = new FaqGroup();
      ng.setName(group);
      ng.setPosition((int) faqs.count());
      return ng;
    });
    List<FaqItemValue> mapped = items == null ? List.of() :
        items.stream().map(x -> new FaqItemValue(nz(x.q()), nz(x.a()))).toList();
    g.setItems(new ArrayList<>(mapped));
    faqs.save(g);
    return items == null ? List.of() : items;
  }

  // ---------- Site info ----------

  public SiteInfoDto getInfo() {
    return info.findById(1).map(ContentService::toDto).orElseGet(() ->
        new SiteInfoDto("", "", "", List.of(), ""));
  }

  @Transactional
  public SiteInfoDto putInfo(SiteInfoDto in) {
    SiteInfo s = info.findById(1).orElseGet(() -> {
      SiteInfo n = new SiteInfo();
      n.setId(1);
      return n;
    });
    s.setEmail(nz(in.email()));
    s.setPhone(nz(in.phone()));
    s.setWhatsapp(nz(in.whatsapp()));
    s.setPricingNote(nz(in.pricingNote()));
    s.setCities(in.cities() == null ? new ArrayList<>() : new ArrayList<>(in.cities()));
    info.save(s);
    return toDto(s);
  }

  // ---------- Aggregate ----------

  public SiteContentDto aggregate(boolean onlyPublished) {
    return new SiteContentDto(listServices(onlyPublished), listPlans(), allFaqs(), getInfo());
  }

  public static SiteInfoDto toDto(SiteInfo s) {
    return new SiteInfoDto(s.getEmail(), s.getPhone(), s.getWhatsapp(),
        s.getCities() == null ? List.of() : s.getCities(), s.getPricingNote());
  }

  // ---------- helpers ----------

  private static String nz(String s) { return s == null ? "" : s; }
  private static String nz(String s, String d) { return (s == null || s.isBlank()) ? d : s; }

  public static String slugify(String input) {
    if (input == null) return "";
    String s = java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD)
        .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
        .toLowerCase()
        .replaceAll("[^a-z0-9]+", "-")
        .replaceAll("^-+|-+$", "");
    return s.isEmpty() ? "service" : s;
  }
}
