using DatingApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DatingApp.Infrastructure.Persistence.Configurations;

// Users are never hard-deleted, so links to Users use NoAction (avoids SQL Server's multiple-cascade-path error).

public class ShortlistConfiguration : IEntityTypeConfiguration<Shortlist>
{
    public void Configure(EntityTypeBuilder<Shortlist> builder)
    {
        builder.HasIndex(s => new { s.UserId, s.ProfileId }).IsUnique();
        builder.HasOne<CandidateProfile>().WithMany().HasForeignKey(s => s.ProfileId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<User>().WithMany().HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.NoAction);
    }
}

public class SavedSearchConfiguration : IEntityTypeConfiguration<SavedSearch>
{
    public void Configure(EntityTypeBuilder<SavedSearch> builder)
    {
        builder.Property(s => s.Name).HasMaxLength(60).IsRequired();
        builder.Property(s => s.FiltersJson).HasMaxLength(2000).IsRequired();
        builder.HasIndex(s => new { s.UserId, s.Name }).IsUnique();
        builder.HasOne<User>().WithMany().HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class BlockConfiguration : IEntityTypeConfiguration<Block>
{
    public void Configure(EntityTypeBuilder<Block> builder)
    {
        builder.Property(b => b.Reason).HasMaxLength(100);
        builder.HasIndex(b => new { b.BlockerProfileId, b.BlockedProfileId }).IsUnique();
        builder.HasIndex(b => b.BlockedProfileId);
        builder.HasOne<CandidateProfile>().WithMany().HasForeignKey(b => b.BlockerProfileId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne<CandidateProfile>().WithMany().HasForeignKey(b => b.BlockedProfileId).OnDelete(DeleteBehavior.NoAction);
    }
}

public class ReportConfiguration : IEntityTypeConfiguration<Report>
{
    public void Configure(EntityTypeBuilder<Report> builder)
    {
        builder.Property(r => r.Details).HasMaxLength(1000);
        builder.Property(r => r.ConversationId).HasMaxLength(100);
        builder.Property(r => r.StaffNote).HasMaxLength(1000);
        builder.HasIndex(r => new { r.Status, r.CreatedAt });
        builder.HasIndex(r => new { r.ReporterUserId, r.ReportedProfileId });
        builder.HasOne<User>().WithMany().HasForeignKey(r => r.ReporterUserId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne<CandidateProfile>().WithMany().HasForeignKey(r => r.ReportedProfileId).OnDelete(DeleteBehavior.NoAction);
    }
}
