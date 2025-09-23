package co.hyperflex.ai;

public class SessionContextHolder {
  private SessionContextHolder() {
  }

  private static final ThreadLocal<SessionContext> sessionContextHolder = new ThreadLocal<>();

  public static SessionContext getSessionContext() {
    return sessionContextHolder.get();
  }

  public static void setSessionContext(SessionContext sessionContext) {
    sessionContextHolder.set(sessionContext);
  }

  public static void removeSessionContext() {
    sessionContextHolder.remove();
  }
}
