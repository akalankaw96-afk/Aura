using System.Threading.RateLimiting;

namespace DatingApp.WebApi.Auth;

/// <summary>Per-IP limits on the auth endpoints, on top of the per-account limits in AuthRules.</summary>
public static class RateLimits
{
    /// <summary>Login, register, verify, refresh: 20 requests / minute / IP.</summary>
    public const string Auth = "auth";
    /// <summary>Endpoints that send an SMS or e-mail: 5 requests / minute / IP.</summary>
    public const string Codes = "codes";

    public static IServiceCollection AddAuthRateLimits(this IServiceCollection services) =>
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddPolicy(Auth, ctx => PerIp(ctx, 20));
            options.AddPolicy(Codes, ctx => PerIp(ctx, 5));
            options.OnRejected = async (context, ct) =>
            {
                context.HttpContext.Response.ContentType = "application/problem+json";
                await context.HttpContext.Response.WriteAsJsonAsync(new
                {
                    type = "https://vikasitha.lk/errors/rate-limited",
                    title = "Too many requests. Please wait a minute and try again.",
                    status = 429,
                    code = "RATE_LIMITED",
                    retryAfterSeconds = 60
                }, ct);
            };
        });

    private static RateLimitPartition<string> PerIp(HttpContext ctx, int permits) =>
        RateLimitPartition.GetFixedWindowLimiter(
            ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permits,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
}
