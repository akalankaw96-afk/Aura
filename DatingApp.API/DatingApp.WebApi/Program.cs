using DatingApp.Infrastructure;
using DatingApp.Infrastructure.Persistence;
using DatingApp.Infrastructure.Services;
using DatingApp.WebApi.Auth;
using DatingApp.WebApi.Errors;
using DatingApp.WebApi.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 0. Secrets come from user-secrets (Development) or environment variables — never appsettings.json (BUG-007)
var jwtSecret = builder.Configuration["JwtSettings:Secret"];
if (string.IsNullOrWhiteSpace(jwtSecret) || Encoding.UTF8.GetByteCount(jwtSecret) < JwtTokenGenerator.MinSecretBytes)
{
    throw new InvalidOperationException(
        "JwtSettings:Secret is missing or shorter than 32 bytes. Set it with: " +
        "dotnet user-secrets set \"JwtSettings:Secret\" \"<64 random characters>\" --project DatingApp.WebApi");
}
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "AuraMatrimony";
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? "AuraMatrimonyApp";

// 1. Infrastructure & application services
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddSingleton<AuthCookieSettings>();

// 2. Controllers, SignalR, errors as ProblemDetails (API_GUIDELINES.md §4)
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = ctx =>
    {
        ctx.ProblemDetails.Extensions["traceId"] = ctx.HttpContext.TraceIdentifier;
        if (!ctx.ProblemDetails.Extensions.ContainsKey("code"))
        {
            ctx.ProblemDetails.Extensions["code"] = ctx.ProblemDetails.Status switch
            {
                400 => "VALIDATION_FAILED",
                401 => "UNAUTHENTICATED",
                403 => "FORBIDDEN",
                404 => "NOT_FOUND",
                429 => "RATE_LIMITED",
                _ => "SERVER_ERROR"
            };
        }
    };
});
builder.Services.AddExceptionHandler<AppExceptionHandler>();
builder.Services.AddAuthRateLimits();

// 3. CORS: only the web app's own origins, with credentials for the refresh cookie (BUG-006)
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("WebApp", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 4. JWT authentication (access tokens only; refresh tokens live in the httpOnly cookie)
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 5. Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Aura Matrimony API - .NET 9 Clean Architecture",
        Version = "v1",
        Description = "Backend API for professional matrimony & matchmaking with SQL Server and Clean Architecture."
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 6. Database: migrations on start, content seed only — no demo members (BUG-013, BUG-015)
using (var scope = app.Services.CreateScope())
{
    var initialiser = scope.ServiceProvider.GetRequiredService<ApplicationDbContextInitialiser>();
    await initialiser.InitialiseAsync();
    await initialiser.SeedAsync();
}

// 7. Middleware pipeline
app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Aura Matrimony API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("WebApp");
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

app.Run();
