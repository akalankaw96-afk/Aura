using DatingApp.Application.Services;

namespace DatingApp.WebApi.Billing;

/// <summary>
/// Every hour (and shortly after start-up): ends plan periods that are over, sends "ends in 3 days" reminders and
/// refreshes the cached plan on profiles (S04-T02); erases deleted accounts after 30 days (S04-T08). The plan itself is always read from the subscriptions, so a late
/// run never gives anyone extra paid time — it only updates badges and reminders.
/// </summary>
public class BillingMaintenanceService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);
    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<BillingMaintenanceService> _logger;

    public BillingMaintenanceService(IServiceScopeFactory scopes, ILogger<BillingMaintenanceService> logger)
    {
        _scopes = scopes;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // let the database migrations at start-up finish first
        try { await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken); } catch (OperationCanceledException) { return; }

        using var timer = new PeriodicTimer(Interval);
        do
        {
            try
            {
                using var scope = _scopes.CreateScope();
                var subscriptions = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();
                var (expired, reminded) = await subscriptions.RunMaintenanceAsync(DateTime.UtcNow, stoppingToken);
                if (expired > 0 || reminded > 0)
                    _logger.LogInformation("Billing maintenance: {Expired} plan period(s) ended, {Reminded} reminder(s) sent.", expired, reminded);

                // deleted accounts whose 30 days are over (S04-T08)
                var erased = await scope.ServiceProvider.GetRequiredService<IAccountService>().EraseDueAsync(DateTime.UtcNow, stoppingToken);
                if (erased > 0) _logger.LogInformation("Account erasure: {Erased} deleted account(s) erased.", erased);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Billing maintenance failed; it will try again next hour.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
