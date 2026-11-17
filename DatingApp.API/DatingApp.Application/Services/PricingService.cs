using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using DatingApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>Prices for plans and boosts, kept in the database and set by the admin (S04-T01).</summary>
public interface IPricingService
{
    Task<List<PlanPriceDto>> GetPricesAsync(CancellationToken ct = default);
    Task<List<PlanPriceDto>> UpdatePricesAsync(Guid adminUserId, List<PlanPriceDto> prices, CancellationToken ct = default);
}

public class PricingService : IPricingService
{
    public const string Boost = "boost";
    public const long MaxAmountCents = 10_000_000_00; // LKR 10 million

    /// <summary>Starting prices (owner decision 2026-11-16 — the Plans page prices), in cents.</summary>
    public static readonly (BillingProduct Product, string PlanId, int Months, int Days, long AmountCents)[] Defaults =
    {
        (BillingProduct.Plan, Plans.Gold, 1, 0, 2_500_00),
        (BillingProduct.Plan, Plans.Gold, 3, 0, 6_375_00),
        (BillingProduct.Plan, Plans.Gold, 6, 0, 11_250_00),
        (BillingProduct.Plan, Plans.Platinum, 1, 0, 6_500_00),
        (BillingProduct.Plan, Plans.Platinum, 3, 0, 16_575_00),
        (BillingProduct.Plan, Plans.Platinum, 6, 0, 29_250_00),
        (BillingProduct.Boost, Boost, 0, 7, 500_00),
    };

    private readonly IApplicationDbContext _context;

    public PricingService(IApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>Adds any missing default price; never overwrites what the admin set. Used at startup and in tests.</summary>
    public static async Task EnsureDefaultsAsync(IApplicationDbContext context, CancellationToken ct = default)
    {
        var existing = await context.PlanPrices.ToListAsync(ct);
        foreach (var d in Defaults)
        {
            if (existing.Any(e => e.Product == d.Product && e.PlanId == d.PlanId && e.Months == d.Months && e.Days == d.Days)) continue;
            context.PlanPrices.Add(new PlanPrice { Product = d.Product, PlanId = d.PlanId, Months = d.Months, Days = d.Days, AmountCents = d.AmountCents });
        }
        await context.SaveChangesAsync(ct);
    }

    public async Task<List<PlanPriceDto>> GetPricesAsync(CancellationToken ct = default)
    {
        var rows = await _context.PlanPrices.AsNoTracking().Where(p => p.IsActive).ToListAsync(ct);
        return rows
            .OrderBy(p => p.Product).ThenBy(p => p.PlanId == Plans.Gold ? 0 : 1).ThenBy(p => p.Months).ThenBy(p => p.Days)
            .Select(p => ToDto(p, rows))
            .ToList();
    }

    public async Task<List<PlanPriceDto>> UpdatePricesAsync(Guid adminUserId, List<PlanPriceDto> prices, CancellationToken ct = default)
    {
        var rows = await _context.PlanPrices.ToListAsync(ct);
        var now = DateTime.UtcNow;
        foreach (var item in prices ?? new List<PlanPriceDto>())
        {
            var product = (item.Product ?? string.Empty).Trim().ToLowerInvariant() switch
            {
                "plan" => BillingProduct.Plan,
                "boost" => BillingProduct.Boost,
                _ => throw AppException.Validation("Product must be plan or boost.", "product")
            };
            var planId = (item.PlanId ?? string.Empty).Trim().ToLowerInvariant();
            if (product == BillingProduct.Plan && planId is not (Plans.Gold or Plans.Platinum))
                throw AppException.Validation("Plan must be gold or platinum.", "planId");
            if (product == BillingProduct.Boost) planId = Boost;
            if (product == BillingProduct.Plan && item.Months is < 1 or > 24)
                throw AppException.Validation("A plan lasts 1 to 24 months.", "months");
            if (product == BillingProduct.Boost && item.Days is < 1 or > 90)
                throw AppException.Validation("A boost lasts 1 to 90 days.", "days");
            if (item.AmountCents is < 0 or > MaxAmountCents)
                throw AppException.Validation("Enter a price between LKR 0 and LKR 10,000,000.", "amountCents");

            var months = product == BillingProduct.Plan ? item.Months : 0;
            var days = product == BillingProduct.Boost ? item.Days : 0;
            var row = rows.FirstOrDefault(r => r.Product == product && r.PlanId == planId && r.Months == months && r.Days == days);
            if (row == null)
            {
                row = new PlanPrice { Product = product, PlanId = planId, Months = months, Days = days };
                _context.PlanPrices.Add(row);
                rows.Add(row);
            }
            row.AmountCents = item.AmountCents;
            row.IsActive = true;
            row.UpdatedAt = now;
            row.UpdatedByUserId = adminUserId;
        }
        await _context.SaveChangesAsync(ct);
        return await GetPricesAsync(ct);
    }

    /// <summary>The active price of a plan for a number of months, or a boost for a number of days (null if not sold).</summary>
    public static Task<PlanPrice?> FindAsync(IApplicationDbContext context, BillingProduct product, string planId, int months, int days, CancellationToken ct = default) =>
        context.PlanPrices.AsNoTracking().FirstOrDefaultAsync(p =>
            p.IsActive && p.Product == product && p.PlanId == planId && p.Months == months && p.Days == days, ct);

    private static PlanPriceDto ToDto(PlanPrice p, List<PlanPrice> all)
    {
        int? save = null;
        if (p.Product == BillingProduct.Plan && p.Months > 1)
        {
            var monthly = all.FirstOrDefault(x => x.Product == BillingProduct.Plan && x.PlanId == p.PlanId && x.Months == 1);
            if (monthly is { AmountCents: > 0 })
            {
                var full = monthly.AmountCents * p.Months;
                var pct = (int)Math.Round((full - p.AmountCents) * 100m / full);
                if (pct > 0) save = pct;
            }
        }
        return new PlanPriceDto
        {
            Product = p.Product == BillingProduct.Plan ? "plan" : "boost",
            PlanId = p.PlanId,
            Months = p.Months,
            Days = p.Days,
            AmountCents = p.AmountCents,
            Amount = p.AmountCents / 100m,
            Currency = p.Currency,
            SavePercent = save,
            UpdatedAt = p.UpdatedAt ?? p.CreatedAt
        };
    }
}
