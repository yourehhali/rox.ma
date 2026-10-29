package ma.rox.api.common;

/** Canonical phone normalization shared by auth, OTP and lead-claim paths. */
public final class PhoneNumbers {
  private PhoneNumbers() {}

  /**
   * Normalize to a storable key: strip spaces / dashes / parens, keep a leading
   * {@code +} when present. Empty/null → null. Matches the historic
   * {@code AuthService.normalizePhone} behaviour so existing rows stay lookup-
   * compatible.
   */
  public static String normalize(String raw) {
    if (raw == null) return null;
    String t = raw.trim();
    if (t.isEmpty()) return null;
    boolean plus = t.startsWith("+");
    String digits = t.replaceAll("[^0-9]", "");
    if (digits.isEmpty()) return null;
    return plus ? "+" + digits : digits;
  }
}
