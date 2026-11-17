using DatingApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DatingApp.Infrastructure.Persistence.Configurations;

public class PlanPriceConfiguration : IEntityTypeConfiguration<PlanPrice>
{
    public void Configure(EntityTypeBuilder<PlanPrice> builder)
    {
        builder.Property(p => p.PlanId).HasMaxLength(20).IsRequired();
        builder.Property(p => p.Currency).HasMaxLength(3).IsRequired();
        builder.HasIndex(p => new { p.Product, p.PlanId, p.Months, p.Days }).IsUnique();
    }
}

public class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> builder)
    {
        builder.Property(s => s.PlanId).HasMaxLength(20).IsRequired();
        builder.Property(s => s.Note).HasMaxLength(500);
        builder.HasIndex(s => new { s.UserId, s.Status, s.EndsAt });
        builder.HasIndex(s => new { s.Status, s.EndsAt });
        // users are never hard-deleted
        builder.HasOne<User>().WithMany().HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.NoAction);
    }
}
