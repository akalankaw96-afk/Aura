using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.Services;
using DatingApp.Infrastructure.Persistence;
using DatingApp.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DatingApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // SQL Server by default; InMemory only when explicitly switched on (tests) — BUG-013
        var useInMemory = string.Equals(configuration["UseInMemoryDatabase"], "true", StringComparison.OrdinalIgnoreCase);

        if (useInMemory)
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("AuraMatrimonyDb"));
        }
        else
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString, b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));
        }

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());
        services.AddScoped<ApplicationDbContextInitialiser>();

        // Security services
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddHttpClient<IGoogleTokenValidator, GoogleTokenValidator>();

        // Message senders — log-only until the SMS / e-mail providers are chosen (S01-T03)
        services.AddSingleton<ISmsSender, LoggingSmsSender>();
        services.AddSingleton<IEmailSender, LoggingEmailSender>();

        // Application services
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IOtpService, OtpService>();
        services.AddScoped<ISessionService, SessionService>();
        services.AddScoped<IPasswordService, PasswordService>();
        services.AddScoped<IMatchRequestService, MatchRequestService>();
        services.AddScoped<IContentService, ContentService>();

        return services;
    }
}
