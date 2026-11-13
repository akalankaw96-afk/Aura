namespace DatingApp.Application.Common.Exceptions;

/// <summary>
/// An expected failure with a stable error code. The WebApi turns it into RFC 7807 ProblemDetails
/// (see docs/API_GUIDELINES.md §4). Never put secrets or stack traces in the message.
/// </summary>
public class AppException : Exception
{
    public int Status { get; }
    public string Code { get; }
    public IReadOnlyDictionary<string, object?> Extensions { get; }

    public AppException(int status, string code, string message, IReadOnlyDictionary<string, object?>? extensions = null)
        : base(message)
    {
        Status = status;
        Code = code;
        Extensions = extensions ?? new Dictionary<string, object?>();
    }

    public static AppException Validation(string message, string field) =>
        new(400, ErrorCodes.ValidationFailed, message, new Dictionary<string, object?>
        {
            ["errors"] = new Dictionary<string, string[]> { [field] = new[] { message } }
        });

    public static AppException Unauthenticated(string message = "Please log in to continue.") =>
        new(401, ErrorCodes.Unauthenticated, message);

    public static AppException NotFound(string message = "Not found.") =>
        new(404, ErrorCodes.NotFound, message);

    public static AppException RateLimited(string message, int retryAfterSeconds) =>
        new(429, ErrorCodes.RateLimited, message, new Dictionary<string, object?> { ["retryAfterSeconds"] = retryAfterSeconds });
}

public static class ErrorCodes
{
    public const string ValidationFailed = "VALIDATION_FAILED";
    public const string Unauthenticated = "UNAUTHENTICATED";
    public const string InvalidCredentials = "INVALID_CREDENTIALS";
    public const string AccountLocked = "ACCOUNT_LOCKED";
    public const string AccountSuspended = "ACCOUNT_SUSPENDED";
    public const string AlreadyExists = "ALREADY_EXISTS";
    public const string NotFound = "NOT_FOUND";
    public const string RateLimited = "RATE_LIMITED";
    public const string CodeInvalid = "CODE_INVALID";
    public const string CodeExpired = "CODE_EXPIRED";
    public const string TooManyAttempts = "TOO_MANY_ATTEMPTS";
    public const string ResetTokenInvalid = "RESET_TOKEN_INVALID";
    public const string GoogleTokenInvalid = "GOOGLE_TOKEN_INVALID";
}
