using DatingApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DatingApp.Infrastructure.Persistence.Configurations;

public class PlanLimitConfiguration : IEntityTypeConfiguration<PlanLimit>
{
    public void Configure(EntityTypeBuilder<PlanLimit> builder)
    {
        builder.Property(p => p.PlanId).HasMaxLength(20).IsRequired();
        builder.HasIndex(p => new { p.PlanId, p.Feature }).IsUnique();
    }
}

public class UsageCounterConfiguration : IEntityTypeConfiguration<UsageCounter>
{
    public void Configure(EntityTypeBuilder<UsageCounter> builder)
    {
        builder.HasIndex(u => new { u.UserId, u.Feature, u.PeriodStart }).IsUnique();
    }
}

public class ProfileViewConfiguration : IEntityTypeConfiguration<ProfileView>
{
    public void Configure(EntityTypeBuilder<ProfileView> builder)
    {
        builder.HasIndex(v => new { v.ViewerUserId, v.ViewedProfileId }).IsUnique();
        builder.HasIndex(v => new { v.ViewedProfileId, v.LastViewedAt });
        builder.HasOne<CandidateProfile>().WithMany().HasForeignKey(v => v.ViewedProfileId).OnDelete(DeleteBehavior.Cascade);
        // users are never hard-deleted; NoAction avoids a second cascade path through CandidateProfile
        builder.HasOne<User>().WithMany().HasForeignKey(v => v.ViewerUserId).OnDelete(DeleteBehavior.NoAction);
    }
}

/// <summary>Search indexes (S03-T01): approved profiles filtered by gender / birth date, newest first.</summary>
public class CandidateProfileSearchConfiguration : IEntityTypeConfiguration<CandidateProfile>
{
    public void Configure(EntityTypeBuilder<CandidateProfile> builder)
    {
        builder.HasIndex(p => new { p.Status, p.Gender, p.DateOfBirth });
        builder.HasIndex(p => new { p.Status, p.CreatedAt });
        // plan cache (S04-T02)
        builder.Property(p => p.PlanId).HasMaxLength(20).IsRequired().HasDefaultValue("free");
        // blocked / deactivated accounts (S04-T07)
        builder.Property(p => p.IsHidden).HasDefaultValue(false);
    }
}
