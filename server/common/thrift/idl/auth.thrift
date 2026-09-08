namespace rs auth
struct Context { 1: required string traceId, 2: optional string sessionToken }
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
enum FailureCode {
  Unauthenticated = 1, ReauthRequired = 2, AuthenticationFailed = 3,
  CeremonyInvalid = 4, NoPasskey = 5, PasskeyExists = 6,
  InvalidRequest = 7, NotFound = 8, RateLimited = 9, Unavailable = 10
}
exception AuthFailure { 1: required FailureCode code, 2: optional i32 retryAfterSeconds }
service AuthService {
  bool Ready(),
  LoginResult LoginPassword(1: Context ctx, 2: string username, 3: string password) throws (1: AuthFailure err),
  Session Check(1: Context ctx) throws (1: AuthFailure err),
  void Logout(1: Context ctx) throws (1: AuthFailure err),
  Session ReauthPassword(1: Context ctx, 2: string password) throws (1: AuthFailure err),
  Options BeginLogin(1: CeremonyContext ctx) throws (1: AuthFailure err),
  LoginResult FinishLogin(1: CeremonyContext ctx, 2: string credentialJson) throws (1: AuthFailure err),
  Options BeginReauth(1: CeremonyContext ctx) throws (1: AuthFailure err),
  Session FinishReauth(1: CeremonyContext ctx, 2: string credentialJson) throws (1: AuthFailure err),
  list<PasskeyInfo> ListPasskeys(1: Context ctx) throws (1: AuthFailure err),
  Options BeginRegistration(1: CeremonyContext ctx, 2: string name) throws (1: AuthFailure err),
  PasskeyInfo FinishRegistration(1: CeremonyContext ctx, 2: string credentialJson) throws (1: AuthFailure err),
  PasskeyInfo RenamePasskey(1: Context ctx, 2: string id, 3: string name) throws (1: AuthFailure err),
  bool DeletePasskey(1: Context ctx, 2: string id) throws (1: AuthFailure err)
}
