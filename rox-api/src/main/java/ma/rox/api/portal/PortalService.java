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
import ma.rox.api.error.ApiException;
import ma.rox.api.portal.PortalDtos.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PortalService {

  public static final List<String> PHASES = List.of("cadrage", "maquette", "developpement", "lancement");
  private static final List<String> TASK_LABELS = List.of(
      "Cadrage : brief + audit validés",
      "Maquette : wireframes + UI validés",
      "Développement : intégration + contenu",
      "Lancement : mise en ligne + suivi");

  private final OrderRepo orders;
  private final MessageRepo messages;
  private final BookingRepo bookings;
  private final ClientRepo clients;

  public PortalService(OrderRepo orders, MessageRepo messages, BookingRepo bookings, ClientRepo clients) {
    this.orders = orders;
    this.messages = messages;
    this.bookings = bookings;
    this.clients = clients;
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
    return new AdminOrderDto(toDto(o), new ClientRefDto(c.getId(), c.getName(), c.getEmail()));
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
    o.setDeadline(input.deadline() == null ? "" : input.deadline());
    o.setPhase("cadrage");
    o.setStatus("active");
    OffsetDateTime now = nowUtc();
    o.setCreatedAt(now);

    for (int i = 0; i < TASK_LABELS.size(); i++) {
      OrderTask t = new OrderTask();
      t.setId(prefixed("t"));
      t.setOrder(o);
      t.setLabel(TASK_LABELS.get(i));
      t.setDone(false);
      t.setUpdatedAt(now);
      t.setPosition(i);
      o.getTasks().add(t);
    }
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
    return o;
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
    return orders.save(o);
  }

  @Transactional
  public Order setStatus(String orderId, String status) {
    if (!status.equals("active") && !status.equals("Terminé")) {
      throw ApiException.badRequest("Statut invalide.", List.of(new ma.rox.api.error.ApiError.FieldIssue("status", "not_in_enum")));
    }
    Order o = orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Commande"));
    o.setStatus(status);
    addEvent(o, "Statut → " + status, nowUtc());
    return orders.save(o);
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
    return messages.save(m);
  }

  @Transactional
  public CallBooking book(String clientId, String date, String time, String subject) {
    ClientAccount c = clients.findById(clientId).orElseThrow(() -> ApiException.notFound("Client"));
    CallBooking b = new CallBooking();
    b.setId(prefixed("b"));
    b.setClient(c);
    try {
      b.setDate(LocalDate.parse(date));
    } catch (java.time.format.DateTimeParseException ex) {
      throw ApiException.badRequest("Date invalide (attendu yyyy-MM-dd).",
          List.of(new ma.rox.api.error.ApiError.FieldIssue("date", "format")));
    }
    try {
      String[] parts = time.split(":");
      b.setTime(LocalTime.of(Integer.parseInt(parts[0]), parts.length > 1 ? Integer.parseInt(parts[1]) : 0));
    } catch (RuntimeException ex) {
      throw ApiException.badRequest("Heure invalide (attendu HH:mm).",
          List.of(new ma.rox.api.error.ApiError.FieldIssue("time", "format")));
    }
    b.setSubject(subject == null ? "" : subject);
    b.setStatus("demandé");
    return bookings.save(b);
  }

  @Transactional
  public CallBooking confirmBooking(String bookingId) {
    CallBooking b = bookings.findById(bookingId).orElseThrow(() -> ApiException.notFound("Créneau"));
    b.setStatus("confirmé");
    return bookings.save(b);
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
    return clients.findAll();
  }

  public ClientAccount requireClient(String id) {
    return clients.findById(id).orElseThrow(() -> ApiException.notFound("Client"));
  }

  // ---------- Helpers ----------

  private void addEvent(Order o, String note, OffsetDateTime at) {
    OrderEvent e = new OrderEvent();
    e.setId(prefixed("e"));
    e.setOrder(o);
    e.setAt(at);
    e.setNote(note);
    o.getEvents().add(e);
  }
}
