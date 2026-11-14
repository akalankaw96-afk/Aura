using DatingApp.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DatingApp.Infrastructure.Services;

/// <summary>
/// Placeholder SMS sender until a Sri Lankan SMS gateway is chosen (S01-T03).
/// Message text — which contains codes — is logged only when <c>Messaging:LogMessageBodies</c> is true
/// (Development). Codes are never returned by the API.
/// </summary>
public class LoggingSmsSender : ISmsSender
{
    private readonly ILogger<LoggingSmsSender> _logger;
    private readonly bool _logBodies;

    public LoggingSmsSender(ILogger<LoggingSmsSender> logger, IConfiguration configuration)
    {
        _logger = logger;
        _logBodies = string.Equals(configuration["Messaging:LogMessageBodies"], "true", StringComparison.OrdinalIgnoreCase);
    }

    public Task SendAsync(string phoneNumber, string message, CancellationToken ct = default)
    {
        if (_logBodies)
            _logger.LogInformation("[DEV SMS] To {Phone}: {Message}", phoneNumber, message);
        else
            _logger.LogWarning("SMS provider not configured — message to {PhoneTail} was not sent.", Tail(phoneNumber));
        return Task.CompletedTask;
    }

    private static string Tail(string value) => value.Length <= 2 ? "**" : "…" + value[^2..];
}

/// <summary>Placeholder e-mail sender until an e-mail provider is chosen. Same logging rule as SMS.</summary>
public class LoggingEmailSender : IEmailSender
{
    private readonly ILogger<LoggingEmailSender> _logger;
    private readonly bool _logBodies;

    public LoggingEmailSender(ILogger<LoggingEmailSender> logger, IConfiguration configuration)
    {
        _logger = logger;
        _logBodies = string.Equals(configuration["Messaging:LogMessageBodies"], "true", StringComparison.OrdinalIgnoreCase);
    }

    public Task SendAsync(string email, string subject, string body, CancellationToken ct = default)
    {
        if (_logBodies)
            _logger.LogInformation("[DEV EMAIL] To {Email} — {Subject}: {Body}", email, subject, body);
        else
            _logger.LogWarning("E-mail provider not configured — \"{Subject}\" was not sent.", subject);
        return Task.CompletedTask;
    }
}
