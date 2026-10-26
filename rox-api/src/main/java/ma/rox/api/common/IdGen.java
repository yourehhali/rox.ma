package ma.rox.api.common;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

public final class IdGen {
  private IdGen() {}

  public static String prefixed(String prefix) {
    return prefix + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
  }

  public static String jti() {
    return UUID.randomUUID().toString();
  }

  public static OffsetDateTime nowUtc() {
    return OffsetDateTime.now(ZoneOffset.UTC);
  }

  public static String iso(OffsetDateTime dt) {
    return dt == null ? null : dt.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
  }
}
