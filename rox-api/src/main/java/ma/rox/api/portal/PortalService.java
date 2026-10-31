package ma.rox.api.portal;

import static ma.rox.api.common.IdGen.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import ma.rox.api.auth.AuthDtos.ClientUserDto;
import ma.rox.api.auth.AuthService;
import ma.rox.api.auth.ClientAccount;
import ma.rox.api.auth.ClientRepo;
import ma.rox.api.common.PhoneNumbers;
import ma.rox.api.error.ApiException;
import ma.rox.api.events.Events;
import ma.rox.api.portal.PortalDtos.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PortalService {

  public static final List<String> PHASES = List.of("cadrage", "maquette", "developpement", "lancement");
  /** A new order starts with a single step — the discovery call. The admin composes the rest. */
  private static final String INITIAL_STEP_LABEL = "Appel de cadrage";

  private final OrderRepo orders;
  private final MessageRepo messages;
  private final BookingRepo bookings;
  private final ClientRepo clients;
  private final ApplicationEventPublisher events;
  private final ma.rox.api.notification.NotificationService notifier;

  public PortalService(OrderRepo orders, MessageRepo messages, BookingRepo bookings, ClientRepo clients,
                       ApplicationEventPublisher events,
                       ma.rox.api.notification.NotificationService notifier) {
    this.orders = orders;
    this.messages = messages;
    this.bookings = bookings;
    this.clients = clients;
    this.events = events;
    this.notifier = notifier;
  }

  // ---------- Read / mapping ----------

  public OrderDto toDto(Order o) {
    return new OrderDto(
        o.getId(), o.getTitle(), o.getService(), o.getDescription(), o.getBudget(), o.getDeadline(),
        o.getPhase(), o.getStatus(), iso(o.getCreatedAt()),
        o.getTasks().stream().map(t -> new TaskDto(t.getId(), t.getLabel(), t.isDone(), iso(t.getUpdatedAt()))).toList(),
        o.getEvents().stream().map(e -> new OrderEventDto(e.getId(), iso(e.getAt()), e.getNote())).toList(),
        o.getRequests().stream().map(r -> new ChangeRequestDto(r.getId(), r.getType(), r.getNote(), iso(r.getAt()), r.getStatus())).toList(),
        o.getHistory().stream().map(h -> new ServiceHistoryItemDto(h.getId(), h.getService(), h.getYear(), h.getOutcome())).toList());
  }

  public AdminOrderDto toAdminDto(Order o) {
    ClientAccount c = o.getClient();
    ClientRefDto ref = c == null
        ? new ClientRefDto(null, o.getClientName(), o.getClientEmail())
        : new ClientRefDto(c.getId(), c.getName(), c.getEmail());
    return new AdminOrderDto(toDto(o), ref);
  }

  public MessageDto toDto(Message m) {
    return new MessageDto(
        m.getId(),
        m.getClient().getId(),
        m.getOrder() == null ? null : m.getOrder().getId(),
        iso(m.getAt()),
        m.getSender(),
        m.getText());
  }

  public CallBookingDto toDto(CallBooking b) {
    return new CallBookingDto(b.getId(), b.getClient().getId(),
        b.getDate().toString(), String.format("%02d:%02d", b.getTime().getHour(), b.getTime().getMinute()),
        b.getSubject(), b.getStatus());
  }

  public AdminBookingDto toAdminDto(CallBooking b) {
    ClientAccount c = b.getClient();
    return new AdminBookingDto(toDto(b), new ClientRefDto(c.getId(), c.getName(), c.getEmail()));
  }

  public PortalDataDto buildPortal(ClientAccount c) {
    List<OrderDto> os = orders.findByClientIdOrderByCreatedAtDesc(c.getId()).stream().map(this::toDto).toList();
    List<MessageDto> ms = messages.findByClientIdOrderByAtAsc(c.getId()).stream().map(this::toDto).toList();
    List<CallBookingDto> bs = bookings.findByClientIdOrderByDateAsc(c.getId()).stream().map(this::toDto).toList();
    ClientUserDto u = AuthService.toClientDto(c);
    return new PortalDataDto(u, os, ms, bs);
  }

  public AdminStatsDto adminStats() {
    long total = clients.count();
    long active = orders.countByStatus("active");
    long completed = orders.countByStatus("Terminé");
    long open = orders.countOpenRequests();
    return new AdminStatsDto(total, active, completed, open);
  }

  // ---------- Mutations ----------

  @Transactional
  public Order createOrder(String clientId, NewOrderInput input) {
    ClientAccount c = clients.findById(clientId).orElseThrow(() -> ApiException.notFound("Client"));
    Order o = new Order();
    o.setId(prefixed("o"));
    o.setClient(c);
    o.setTitle(input.title().trim());
    o.setService(input.service().trim());
    o.setDescription(input.description() == null ? "" : input.description());
    o.setBudget(input.budget() == null ? "" : input.budget());
    o.setDeadline(normalizeDeadline(input.deadline()));
    o.setPhase("cadrage");
    o.setStatus("active");
    o.setStage("LEAD");
    OffsetDateTime now = nowUtc();
    o.setCreatedAt(now);

    OrderTask firstStep = new OrderTask();
    firstStep.setId(prefixed("t"));
    firstStep.setOrder(o);
    firstStep.setLabel(INITIAL_STEP_LABEL);
    firstStep.setDone(false);
    firstStep.setUpdatedAt(now);
    firstStep.setPosition(0);
    o.getTasks().add(firstStep);
    if (input.pastServices() != null) {
      for (var hs : input.pastServices()) {
        ServiceHistory sh = new ServiceHistory();
        sh.setId(hs.id() == null || hs.id().isBlank() ? prefixed("sh") : hs.id());
        sh.setOrder(o);
        sh.setService(hs.service().trim());
        sh.setYear(hs.year().trim());
        sh.setOutcome(hs.outcome().trim());
        o.getHistory().add(sh);
      }
    }
    addEvent(o, "Brief reçu", now);
    orders.save(o);
    events.publishEvent(new Events.OrderCreated(o.getId(), c.getId(), o.getTitle(), o.getService()));
    return o;
  }

  /** Public lead: an order with no owning account yet. Claimed by phone at OTP verify. */
  @Transactional
  public Order createGuestOrder(GuestOrderRequest input) {
    Order o = new Order();
    o.setId(prefixed("o"));
    o.setClient(null);
    String phone = PhoneNumbers.normalize(input.phone());
    String leadName = input.name() == null || input.name().isBlank() ? phone : input.name().trim();
    o.setClientEmail(null);
    o.setClientName(leadName);
    o.setClientPhone(phone);
    o.setTitle(input.title() == null || input.title().isBlank() ? "Nouvelle demande" : input.title().trim());
    o.setService(input.service() == null ? "" : input.service().trim());
    String desc = input.description() == null ? "" : input.description();
    if (input.city() != null && !input.city().isBlank()) {
      desc = desc + "\n\nVille : " + input.city().trim();
    }
    o.setDescription(desc);
    o.setBudget(input.budget() == null ? "" : input.budget());
    o.setDeadline(normalizeDeadline(input.deadline()));
    o.setPhase("cadrage");
    o.setStatus("active");
    o.setStage("LEAD");
    OffsetDateTime now = nowUtc();
    o.setCreatedAt(now);

    OrderTask firstStep = new OrderTask();
    firstStep.setId(prefixed("t"));
    firstStep.setOrder(o);
    firstStep.setLabel(INITIAL_STEP_LABEL);
    firstStep.setDone(false);
    firstStep.setUpdatedAt(now);
    firstStep.setPosition(0);
    o.getTasks().add(firstStep);
    if (input.pastServices() != null) {
      for (var hs : input.pastServices()) {
        ServiceHistory sh = new ServiceHistory();
        sh.setId(hs.id() == null || hs.id().isBlank() ? prefixed("sh") : hs.id());
        sh.setOrder(o);
        sh.setService(hs.service().trim());
        sh.setYear(hs.year().trim());
        sh.setOutcome(hs.outcome().trim());
        o.getHistory().add(sh);
      }
    }
    addEvent(o, "Brief reçu", now);
    orders.save(o);
    events.publishEvent(new Events.OrderCreated(o.getId(), null, o.getTitle(), o.getService()));
    return o;
  }

  /** Attach every unclaimed lead matching this account's normalized phone. Returns the count claimed. */
  @Transactional
  public int claimLeadsForClientByPhone(ClientAccount c) {
    if (c.getPhone() == null || c.getPhone().isBlank()) return 0;
    List<Order> leads = orders.findByClientIdIsNullAndClientPhone(c.getPhone());
    for (Order o : leads) {
      o.setClient(c);
      // Keep the captured contact as-is; the owning client is now authoritative.
    }
    if (!leads.isEmpty()) orders.saveAll(leads);
    return leads.size();
  }

  /** Attach every unclaimed lead matching this account's email. Returns the count claimed. */
  @Transactional
  public int claimLeadsForClient(ClientAccount c) {
    List<Order> leads = orders.findByClientIdIsNullAndClientEmailIgnoreCase(c.getEmail());
    for (Order o : leads) {
      o.setClient(c);
      // Keep the captured contact as-is; the owning client is now authoritative.
    }
    if (!leads.isEmpty()) orders.saveAll(leads);
    return leads.size();
  }

  @Transactional
  public Order advancePhase(String orderId, String nextPhase) {
    if (!PHASES.contains(nextPhase)) {
      throw ApiException.badRequest("Phase inconnue.", List.of(new ma.rox.api.error.ApiError.FieldIssue("phase", "not_in_enum")));
    }
    Order o = orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Commande"));
    if (o.getPhase().equals(nextPhase)) {
      throw ApiException.conflict("La commande est déjà à cette phase.");
    }
    o.setPhase(nextPhase);
    addEvent(o, "Phase → " + nextPhase, nowUtc());
    Order saved = orders.save(o);
    events.publishEvent(new Events.PhaseAdvanced(saved.getId(), saved.getClient().getId(), nextPhase));
    return saved;
  }

  @Transactional
  public Order setStatus(String orderId, String status) {
    if (!status.equals("active") && !status.equals("Terminé")) {
      throw ApiException.badRequest("Statut invalide.", List.of(new ma.rox.api.error.ApiError.FieldIssue("status", "not_in_enum")));
    }
    Order o = orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Commande"));
    o.setStatus(status);
    addEvent(o, "Statut → " + status, nowUtc());
    Order saved = orders.save(o);
    events.publishEvent(new Events.StatusChanged(saved.getId(), saved.getClient().getId(), status));
    return saved;
  }

  @Transactional
  public Order toggleTask(String orderId, String taskId) {
    Order o = orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Commande"));
    OrderTask target = o.getTasks().stream().filter(t -> t.getId().equals(taskId)).findFirst()
        .orElseThrow(() -> ApiException.notFound("Tâche"));
    target.setDone(!target.isDone());
    target.setUpdatedAt(nowUtc());
    addEvent(o, (target.isDone() ? "Tâche accomplie : " : "Tâche réouverte : ") + target.getLabel(), nowUtc());
    return orders.save(o);
  }

  /** Admin-defined step: orders start with the call only; the rest of the journey is composed here. */
  @Transactional
  public Order addTask(String orderId, String label) {
    if (label == null || label.isBlank()) {
      throw ApiException.badRequest("Champ 'label' requis.", List.of(new ma.rox.api.error.ApiError.FieldIssue("label", "required")));
    }
    Order o = orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Commande"));
    OrderTask t = new OrderTask();
    t.setId(prefixed("t"));
    t.setOrder(o);
    t.setLabel(label.trim());
    t.setDone(false);
    t.setUpdatedAt(nowUtc());
    t.setPosition(o.getTasks().size());
    o.getTasks().add(t);
    addEvent(o, "Étape ajoutée : " + t.getLabel(), nowUtc());
    return orders.save(o);
  }

  @Transactional
  public Order removeTask(String orderId, String taskId) {
    Order o = orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Commande"));
    OrderTask target = o.getTasks().stream().filter(t -> t.getId().equals(taskId)).findFirst()
        .orElseThrow(() -> ApiException.notFound("Tâche"));
    o.getTasks().remove(target); // orphanRemoval deletes the row
    for (int i = 0; i < o.getTasks().size(); i++) {
      o.getTasks().get(i).setPosition(i);
    }
    addEvent(o, "Étape supprimée : " + target.getLabel(), nowUtc());
    return orders.save(o);
  }

  @Transactional
  public ChangeRequest addRequest(String orderId, String type, String note) {
    if (!type.equals("update") && !type.equals("edit")) {
      throw ApiException.badRequest("Type invalide.", List.of(new ma.rox.api.error.ApiError.FieldIssue("type", "not_in_enum")));
    }
    Order o = orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Commande"));
    ChangeRequest r = new ChangeRequest();
    r.setId(prefixed("r"));
    r.setOrder(o);
    r.setType(type);
    r.setNote(note == null ? "" : note);
    r.setAt(nowUtc());
    r.setStatus("ouvert");
    o.getRequests().add(r);
    orders.save(o);
    events.publishEvent(new Events.ChangeRequestSubmitted(r.getId(), o.getId(), o.getClient().getId(), type));
    return r;
  }

  @Transactional
  public ChangeRequest handleRequest(String orderId, String requestId) {
    Order o = orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Commande"));
    ChangeRequest r = o.getRequests().stream().filter(x -> x.getId().equals(requestId)).findFirst()
        .orElseThrow(() -> ApiException.notFound("Demande de modification"));
    r.setStatus("pris en compte");
    addEvent(o, "Demande prise en compte", nowUtc());
    orders.save(o);
    events.publishEvent(new Events.ChangeRequestHandled(r.getId(), o.getId(), o.getClient().getId()));
    return r;
  }

  @Transactional
  public Message sendMessage(String clientId, String sender, String text, String orderId) {
    ClientAccount c = clients.findById(clientId).orElseThrow(() -> ApiException.notFound("Client"));
    Message m = new Message();
    m.setId(prefixed("m"));
    m.setClient(c);
    if (orderId != null && !orderId.isBlank()) {
      m.setOrder(orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Commande")));
    }
    m.setAt(nowUtc());
    m.setSender(sender);
    m.setText(text);
    Message saved = messages.save(m);
    String preview = text == null ? "" : (text.length() > 200 ? text.substring(0, 197) + "…" : text);
    String orderIdStr = saved.getOrder() == null ? null : saved.getOrder().getId();
    events.publishEvent(new Events.MessagePosted(saved.getId(), orderIdStr, c.getId(), sender, preview));
    // Live delivery on the client-scoped chat room (the app's threads are keyed by client).
    notifier.broadcastChat(c.getId(), "/messages", toDto(saved));
    return saved;
  }

  @Transactional
  public CallBooking book(String clientId, String date, String time, String subject) {
    ClientAccount c = clients.findById(clientId).orElseThrow(() -> ApiException.notFound("Client"));
    CallBooking b = new CallBooking();
    b.setId(prefixed("b"));
    b.setClient(c);
    LocalDate d;
    try {
      d = LocalDate.parse(date);
    } catch (java.time.format.DateTimeParseException ex) {
      throw ApiException.badRequest("Date invalide (attendu yyyy-MM-dd).",
          List.of(new ma.rox.api.error.ApiError.FieldIssue("date", "format")));
    }
    LocalDate today = LocalDate.now();
    if (d.isBefore(today)) {
      throw ApiException.badRequest("La date doit être aujourd'hui ou dans le futur.",
          List.of(new ma.rox.api.error.ApiError.FieldIssue("date", "not_future")));
    }
    if (d.isAfter(today.plusDays(90))) {
      throw ApiException.badRequest("La date ne peut pas dépasser 90 jours.",
          List.of(new ma.rox.api.error.ApiError.FieldIssue("date", "out_of_range")));
    }
    try {
      String[] parts = time.split(":");
      b.setTime(LocalTime.of(Integer.parseInt(parts[0]), parts.length > 1 ? Integer.parseInt(parts[1]) : 0));
    } catch (RuntimeException ex) {
      throw ApiException.badRequest("Heure invalide (attendu HH:mm).",
          List.of(new ma.rox.api.error.ApiError.FieldIssue("time", "format")));
    }
    b.setDate(d);
    b.setSubject(subject == null ? "" : subject);
    b.setStatus("demandé");
    CallBooking saved = bookings.save(b);
    events.publishEvent(new Events.BookingRequested(saved.getId(), c.getId(), date, time));
    return saved;
  }

  @Transactional
  public CallBooking confirmBooking(String bookingId) {
    CallBooking b = bookings.findById(bookingId).orElseThrow(() -> ApiException.notFound("Créneau"));
    b.setStatus("confirmé");
    CallBooking saved = bookings.save(b);
    events.publishEvent(new Events.BookingConfirmed(saved.getId(), saved.getClient().getId(),
        saved.getDate().toString(),
        String.format("%02d:%02d", saved.getTime().getHour(), saved.getTime().getMinute())));
    return saved;
  }

  // ---------- Lookups used by controllers ----------

  public Order requireOrder(String id) {
    return orders.findById(id).orElseThrow(() -> ApiException.notFound("Commande"));
  }

  public List<Order> listOrdersForClient(String clientId) {
    return orders.findByClientIdOrderByCreatedAtDesc(clientId);
  }

  public List<Order> listAllOrders() {
    return orders.findAllByOrderByCreatedAtDesc();
  }

  public List<Message> listMessagesForClient(String clientId) {
    return messages.findByClientIdOrderByAtAsc(clientId);
  }

  public List<CallBooking> listBookingsForClient(String clientId) {
    return bookings.findByClientIdOrderByDateAsc(clientId);
  }

  public List<CallBooking> listAllBookings() {
    return bookings.findAllByOrderByDateAsc();
  }

  public List<CallBooking> listPendingBookings() {
    return bookings.findByStatusOrderByDateAsc("demandé");
  }

  public List<ClientAccount> listClients() {
    // Deterministic roster: `findAll()` without an ORDER BY can reorder between
    // refetches, which makes the admin's conversation picker (and its fallback
    // to "the first client") jump between threads.
    return clients.findAll(Sort.by(Sort.Order.asc("createdAt"), Sort.Order.asc("name")));
  }

  public ClientAccount requireClient(String id) {
    return clients.findById(id).orElseThrow(() -> ApiException.notFound("Client"));
  }

  // ---------- Helpers ----------

  /** Validate the free-form deadline string; today or future when it parses as yyyy-MM-dd; other formats kept as-is. */
  private String normalizeDeadline(String raw) {
    if (raw == null) return "";
    String t = raw.trim();
    if (t.isEmpty()) return "";
    try {
      LocalDate d = LocalDate.parse(t);
      if (d.isBefore(LocalDate.now())) {
        throw ApiException.badRequest("La date limite doit être aujourd'hui ou dans le futur.",
            List.of(new ma.rox.api.error.ApiError.FieldIssue("deadline", "not_future")));
      }
    } catch (java.time.format.DateTimeParseException ignored) {
      // Non-ISO deadline strings are preserved verbatim (existing clients may use free-form text).
    }
    return t;
  }

  private void addEvent(Order o, String note, OffsetDateTime at) {
    OrderEvent e = new OrderEvent();
    e.setId(prefixed("e"));
    e.setOrder(o);
    e.setAt(at);
    e.setNote(note);
    o.getEvents().add(e);
  }
}
