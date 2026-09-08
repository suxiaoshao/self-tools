namespace rs auth

struct Context {
  1: required string traceParent,
  2: optional string sessionToken,
  3: required string requestId,
  4: optional string traceState
}

struct Session {
  1: required string userId, 2: required string username,
  3: required i64 idleExpiresAt, 4: required i64 absoluteExpiresAt,
  5: required i64 recentAuthenticationUntil
}
struct LoginResult { 1: required string sessionToken, 2: required Session session }
struct PasskeyInfo {
  1: required string id, 2: required string name,
  3: required i64 createdAt, 4: optional i64 lastUsedAt
}
struct Options { 1: required string ceremonyId, 2: required string publicKeyJson }
struct CeremonyContext {
  1: required Context context, 2: required string browserBinding,
  3: optional string ceremonyId
}

enum ValidationCode {
  Required = 1, InvalidFormat = 2, TooLong = 3, OutOfRange = 4
}
struct FieldViolation {
  1: required list<string> path,
  2: required ValidationCode code,
  3: optional i64 min,
  4: optional i64 max
}
enum AuthRejectionCode {
  Unauthenticated = 1, ReauthRequired = 2, AuthenticationFailed = 3,
  CeremonyInvalid = 4, NoPasskey = 5, PasskeyExists = 6,
  InvalidRequest = 7, NotFound = 8, RateLimited = 9
}
exception AuthRejected {
  1: required AuthRejectionCode code,
  2: optional i32 retryAfterSeconds,
  3: optional list<FieldViolation> fieldErrors,
  4: optional string resourceId
}
enum ServiceFaultCode { Internal = 1, Unavailable = 2, DeadlineExceeded = 3 }
exception ServiceFault {
  1: required ServiceFaultCode code,
  2: required string requestId
}
struct DeletePasskeyResult {
  1: required string id,
  2: required bool sessionInvalidated
}
service AuthService {
  bool Ready(),
  LoginResult LoginPassword(1: Context ctx, 2: string username, 3: string password)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  Session Check(1: Context ctx)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  void Logout(1: Context ctx)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  Session ReauthPassword(1: Context ctx, 2: string password)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  Options BeginLogin(1: CeremonyContext ctx)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  LoginResult FinishLogin(1: CeremonyContext ctx, 2: string credentialJson)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  Options BeginReauth(1: CeremonyContext ctx)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  Session FinishReauth(1: CeremonyContext ctx, 2: string credentialJson)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  list<PasskeyInfo> ListPasskeys(1: Context ctx)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  Options BeginRegistration(1: CeremonyContext ctx, 2: string name)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  PasskeyInfo FinishRegistration(1: CeremonyContext ctx, 2: string credentialJson)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  PasskeyInfo RenamePasskey(1: Context ctx, 2: string id, 3: string name)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  DeletePasskeyResult DeletePasskey(1: Context ctx, 2: string id)
    throws (1: AuthRejected rejected, 2: ServiceFault fault)
}
