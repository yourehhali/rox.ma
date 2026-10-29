package ma.rox.api.whatsapp;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import ma.rox.api.whatsapp.WhatsAppDtos.SendResult;
import ma.rox.api.whatsapp.WhatsAppSettingsService.Effective;
import org.junit.jupiter.api.Test;

/** Covers chatId normalization, template rendering and the best-effort dispatch rules. */
class WhatsAppOtpServiceTest {

  private static Effective configured() {
    return new Effective(true, "http://openwa:2785", "k", "rox", "sid", "Code {code} pour {name} ({minutes} min).");
  }

  @Test
  void normalizesInternationalPhoneToChatId() {
    assertThat(WhatsAppOtpService.toChatId("+212 600-000-000")).isEqualTo("212600000000@c.us");
    assertThat(WhatsAppOtpService.toChatId("0033600000000")).isEqualTo("33600000000@c.us");
    assertThat(WhatsAppOtpService.toChatId("  +33 6 00 00 00 00 ")).isEqualTo("33600000000@c.us");
  }

  @Test
  void rejectsMissingOrTooShortPhones() {
    assertThat(WhatsAppOtpService.toChatId(null)).isNull();
    assertThat(WhatsAppOtpService.toChatId("   ")).isNull();
    assertThat(WhatsAppOtpService.toChatId("+3312345")).isNull(); // 7 digits < 8
  }

  @Test
  void rendersTemplatePlaceholders() {
    assertThat(WhatsAppOtpService.format("Hi {name}, code {code} for {minutes} min", "123456", 15, "Bob"))
        .isEqualTo("Hi Bob, code 123456 for 15 min");
  }

  @Test
  void fallsBackToDefaultTemplateWhenBlank() {
    String out = WhatsAppOtpService.format(null, "654321", 15, "Bob");
    assertThat(out).contains("654321").contains("15");
  }

  @Test
  void sendSignupCodeSendsWhenConfigured() {
    WhatsAppSettingsService settings = mock(WhatsAppSettingsService.class);
    WhatsAppClient client = mock(WhatsAppClient.class);
    when(settings.effective()).thenReturn(configured());

    new WhatsAppOtpService(settings, client)
        .sendSignupCode("+33600000000", "123456", 15, "Bob");

    verify(client).sendText(
        eq("http://openwa:2785"), eq("k"), eq("sid"),
        eq("33600000000@c.us"), eq("Code 123456 pour Bob (15 min)."));
  }

  @Test
  void sendSignupCodeSkipsWhenDisabled() {
    WhatsAppSettingsService settings = mock(WhatsAppSettingsService.class);
    WhatsAppClient client = mock(WhatsAppClient.class);
    when(settings.effective()).thenReturn(new Effective(
        false, "http://openwa:2785", "k", "rox", "sid", "x"));

    new WhatsAppOtpService(settings, client).sendSignupCode("+33600000000", "123456", 15, "Bob");

    verifyNoInteractions(client);
  }

  @Test
  void sendSignupCodeSkipsWhenNoValidPhone() {
    WhatsAppSettingsService settings = mock(WhatsAppSettingsService.class);
    WhatsAppClient client = mock(WhatsAppClient.class);
    when(settings.effective()).thenReturn(configured());

    new WhatsAppOtpService(settings, client).sendSignupCode(null, "123456", 15, "Bob");

    verifyNoInteractions(client);
  }

  @Test
  void sendSignupCodeSwallowsClientErrors() {
    WhatsAppSettingsService settings = mock(WhatsAppSettingsService.class);
    WhatsAppClient client = mock(WhatsAppClient.class);
    when(settings.effective()).thenReturn(configured());
    when(client.sendText(anyString(), anyString(), anyString(), anyString(), anyString()))
        .thenThrow(new RuntimeException("gateway down"));

    // Must not propagate — signup can't fail on a WhatsApp hiccup.
    new WhatsAppOtpService(settings, client).sendSignupCode("+33600000000", "123456", 15, "Bob");
  }

  @Test
  void sendLoginCodeSendsSynchronouslyWhenConfigured() {
    WhatsAppSettingsService settings = mock(WhatsAppSettingsService.class);
    WhatsAppClient client = mock(WhatsAppClient.class);
    when(settings.effective()).thenReturn(configured());

    new WhatsAppOtpService(settings, client).sendLoginCode("+33600000000", "123456", 15);

    // name is null for login, so {name} collapses to empty.
    verify(client).sendText(
        eq("http://openwa:2785"), eq("k"), eq("sid"),
        eq("33600000000@c.us"), eq("Code 123456 pour  (15 min)."));
  }

  @Test
  void sendLoginCodeThrowsWhenDisabled() {
    WhatsAppSettingsService settings = mock(WhatsAppSettingsService.class);
    WhatsAppClient client = mock(WhatsAppClient.class);
    when(settings.effective()).thenReturn(new Effective(
        false, "http://openwa:2785", "k", "rox", "sid", "x"));

    assertThatThrownBy(() -> new WhatsAppOtpService(settings, client)
        .sendLoginCode("+33600000000", "123456", 15))
        .isInstanceOf(ma.rox.api.error.ApiException.class);
    verifyNoInteractions(client);
  }

  @Test
  void sendLoginCodeThrowsWhenUnpaired() {
    WhatsAppSettingsService settings = mock(WhatsAppSettingsService.class);
    WhatsAppClient client = mock(WhatsAppClient.class);
    when(settings.effective()).thenReturn(new Effective(
        true, "http://openwa:2785", "k", "rox", "", "x")); // blank sessionId

    assertThatThrownBy(() -> new WhatsAppOtpService(settings, client)
        .sendLoginCode("+33600000000", "123456", 15))
        .isInstanceOf(ma.rox.api.error.ApiException.class);
    verifyNoInteractions(client);
  }

  @Test
  void sendLoginCodeThrowsOnInvalidPhone() {
    WhatsAppSettingsService settings = mock(WhatsAppSettingsService.class);
    WhatsAppClient client = mock(WhatsAppClient.class);
    when(settings.effective()).thenReturn(configured());

    assertThatThrownBy(() -> new WhatsAppOtpService(settings, client)
        .sendLoginCode("+3312345", "123456", 15))
        .isInstanceOf(ma.rox.api.error.ApiException.class);
    verifyNoInteractions(client);
  }

  @Test
  void sendLoginCodeWrapsGatewayFailure() {
    WhatsAppSettingsService settings = mock(WhatsAppSettingsService.class);
    WhatsAppClient client = mock(WhatsAppClient.class);
    when(settings.effective()).thenReturn(configured());
    when(client.sendText(anyString(), anyString(), anyString(), anyString(), anyString()))
        .thenThrow(new RuntimeException("gateway down"));

    // Unlike the async signup path, a send failure must surface so the caller can retry.
    assertThatThrownBy(() -> new WhatsAppOtpService(settings, client)
        .sendLoginCode("+33600000000", "123456", 15))
        .isInstanceOf(ma.rox.api.error.ApiException.class);
  }

  @Test
  void sendTestReportsDisabledChannel() {
    WhatsAppSettingsService settings = mock(WhatsAppSettingsService.class);
    WhatsAppClient client = mock(WhatsAppClient.class);
    when(settings.effective()).thenReturn(new Effective(
        false, "http://openwa:2785", "k", "rox", "sid", "x"));

    SendResult r = new WhatsAppOtpService(settings, client).sendTest("+33600000000");

    assertThat(r.sent()).isFalse();
    verifyNoInteractions(client);
  }

  @Test
  void sendTestSendsWhenFullyConfigured() {
    WhatsAppSettingsService settings = mock(WhatsAppSettingsService.class);
    WhatsAppClient client = mock(WhatsAppClient.class);
    when(settings.effective()).thenReturn(configured());
    when(client.sendText(anyString(), anyString(), anyString(), anyString(), anyString()))
        .thenReturn("mid-1");

    SendResult r = new WhatsAppOtpService(settings, client).sendTest("+33600000000");

    assertThat(r.sent()).isTrue();
    assertThat(r.messageId()).isEqualTo("mid-1");
  }
}
