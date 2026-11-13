using DatingApp.Application.Common.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace DatingApp.WebApi.Errors;

/// <summary>
/// Turns exceptions into RFC 7807 ProblemDetails (API_GUIDELINES.md §4, TD-12).
/// AppException → its status + code. Anything else → 500 with no details (logged with the trace id).
/// </summary>
public class AppExceptionHandler : IExceptionHandler
{
    private readonly IProblemDetailsService _problemDetails;
    private readonly ILogger<AppExceptionHandler> _logger;

    public AppExceptionHandler(IProblemDetailsService problemDetails, ILogger<AppExceptionHandler> logger)
    {
        _problemDetails = problemDetails;
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        ProblemDetails problem;

        if (exception is AppException app)
        {
            problem = new ProblemDetails
            {
                Status = app.Status,
                Title = app.Message,
                Type = $"https://vikasitha.lk/errors/{app.Code.ToLowerInvariant().Replace('_', '-')}"
            };
            problem.Extensions["code"] = app.Code;
            foreach (var (key, value) in app.Extensions) problem.Extensions[key] = value;
        }
        else
        {
            _logger.LogError(exception, "Unhandled exception for {Method} {Path}", httpContext.Request.Method, httpContext.Request.Path);
            problem = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Something went wrong. Please try again.",
                Type = "https://vikasitha.lk/errors/server-error"
            };
            problem.Extensions["code"] = "SERVER_ERROR";
        }

        httpContext.Response.StatusCode = problem.Status!.Value;
        return await _problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problem,
            Exception = exception
        });
    }
}
