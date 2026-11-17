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
        // one payment starts at most one plan period (S04-T04: approve once)
        builder.HasIndex(s => s.PaymentId).IsUnique().HasFilter("[PaymentId] IS NOT NULL");
        // users are never hard-deleted
        builder.HasOne<User>().WithMany().HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.NoAction);
    }
}

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.Property(p => p.PlanId).HasMaxLength(20).IsRequired();
        builder.Property(p => p.Currency).HasMaxLength(3).IsRequired();
        builder.Property(p => p.Reference).HasMaxLength(20).IsRequired();
        builder.HasIndex(p => p.Reference).IsUnique();
        builder.Property(p => p.ReceiptKey).HasMaxLength(200);
        builder.Property(p => p.ReceiptContentType).HasMaxLength(50);
        builder.Property(p => p.ReceiptFileName).HasMaxLength(120);
        builder.Property(p => p.MemberNote).HasMaxLength(200);
        builder.Property(p => p.ReviewNote).HasMaxLength(500);
        builder.HasIndex(p => new { p.UserId, p.Status });
        builder.HasIndex(p => new { p.Status, p.SubmittedAt });
        // users are never hard-deleted; payment records are kept
        builder.HasOne<User>().WithMany().HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.NoAction);
    }
}

public class BoostConfiguration : IEntityTypeConfiguration<Boost>
{
    public void Configure(EntityTypeBuilder<Boost> builder)
    {
        builder.Property(b => b.Note).HasMaxLength(500);
        builder.HasIndex(b => new { b.ProfileId, b.EndsAt });
        // one payment starts one boost
        builder.HasIndex(b => b.PaymentId).IsUnique().HasFilter("[PaymentId] IS NOT NULL");
        builder.HasOne<User>().WithMany().HasForeignKey(b => b.UserId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne<CandidateProfile>().WithMany().HasForeignKey(b => b.ProfileId).OnDelete(DeleteBehavior.NoAction);
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.Property(a => a.Action).HasMaxLength(50).IsRequired();
        builder.Property(a => a.Detail).HasMaxLength(500);
        builder.HasIndex(a => new { a.TargetUserId, a.CreatedAt });
        builder.HasIndex(a => a.CreatedAt);
    }
}

public class UserStatusConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.Property(u => u.StatusReason).HasMaxLength(500);
        builder.HasIndex(u => u.DeletionRequestedAt).HasFilter("[DeletionRequestedAt] IS NOT NULL");
    }
}

public class AccountClosureFeedbackConfiguration : IEntityTypeConfiguration<AccountClosureFeedback>
{
    public void Configure(EntityTypeBuilder<AccountClosureFeedback> builder)
    {
        builder.Property(f => f.Reason).HasMaxLength(50).IsRequired();
        builder.Property(f => f.Comment).HasMaxLength(1000);
    }
}
