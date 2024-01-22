namespace rs auth

struct LoginRequest {
    1: required string traceId,
    2: required string username,
    3: required string password,
}

struct LoginReply {
    1: required string auth,
}
struct CheckRequest {
    1: required string traceId,
    2: required string auth,
}

enum AuthErrorCode{
    Jwt,
    PasswordError,
    AuthTimeout,
    TokenError,
    PasswordNotSet,
    SecretKeyNotSet,
    UsernameNotSet
}

exception AuthError{
    1: required AuthErrorCode code,
}

service ItemService {
    LoginReply Login (1: LoginRequest req) throws (1: AuthError err),
    void Check(1: CheckRequest req) throws (1: AuthError err),
}
