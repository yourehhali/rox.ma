package ma.rox.api.notification;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepo extends JpaRepository<Notification, String> {

  List<Notification> findByRecipientRoleAndRecipientIdOrderByCreatedAtDesc(
      String role, String id, Pageable pageable);

  List<Notification> findByRecipientRoleAndRecipientIdAndReadAtIsNullOrderByCreatedAtDesc(
      String role, String id, Pageable pageable);

  long countByRecipientRoleAndRecipientIdAndReadAtIsNull(String role, String id);

  @Modifying
  @Query("update Notification n set n.readAt = CURRENT_TIMESTAMP "
      + "where n.recipientRole = :role and n.recipientId = :id and n.readAt is null")
  int markAllRead(@Param("role") String role, @Param("id") String id);
}
