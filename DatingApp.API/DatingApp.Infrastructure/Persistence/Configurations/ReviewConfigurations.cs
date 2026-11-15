using DatingApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DatingApp.Infrastructure.Persistence.Configurations;

public class CandidateProfileReviewConfiguration : IEntityTypeConfiguration<CandidateProfile>
{
    public void Configure(EntityTypeBuilder<CandidateProfile> builder)
    {
        builder.HasIndex(p => new { p.Status, p.SubmittedAt });
    }
}

public class ProfilePhotoConfiguration : IEntityTypeConfiguration<ProfilePhoto>
{
    public void Configure(EntityTypeBuilder<ProfilePhoto> builder)
    {
        builder.Property(p => p.StorageKey).HasMaxLength(200).IsRequired();
        builder.Property(p => p.ContentType).HasMaxLength(50).IsRequired();
        builder.Property(p => p.RejectReason).HasMaxLength(300);
        builder.HasOne(p => p.Profile).WithMany(p => p.Photos).HasForeignKey(p => p.ProfileId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(p => new { p.ProfileId, p.SortOrder });
        builder.HasIndex(p => p.Status);
    }
}

public class KycDocumentConfiguration : IEntityTypeConfiguration<KycDocument>
{
    public void Configure(EntityTypeBuilder<KycDocument> builder)
    {
        builder.Property(d => d.StorageKey).HasMaxLength(200).IsRequired();
        builder.Property(d => d.ContentType).HasMaxLength(50).IsRequired();
        builder.HasOne(d => d.Profile).WithMany(p => p.KycDocuments).HasForeignKey(d => d.ProfileId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(d => new { d.ProfileId, d.Type });
    }
}

public class ProfileReviewFlagConfiguration : IEntityTypeConfiguration<ProfileReviewFlag>
{
    public void Configure(EntityTypeBuilder<ProfileReviewFlag> builder)
    {
        builder.Property(f => f.Field).HasMaxLength(40).IsRequired();
        builder.Property(f => f.Reason).HasMaxLength(300).IsRequired();
        builder.HasOne(f => f.Profile).WithMany(p => p.ReviewFlags).HasForeignKey(f => f.ProfileId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(f => new { f.ProfileId, f.ResolvedAt });
    }
}

public class ProfileReviewLogConfiguration : IEntityTypeConfiguration<ProfileReviewLog>
{
    public void Configure(EntityTypeBuilder<ProfileReviewLog> builder)
    {
        builder.Property(l => l.Note).HasMaxLength(500);
        builder.HasIndex(l => new { l.ProfileId, l.CreatedAt });
    }
}

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.Property(n => n.Type).HasMaxLength(40).IsRequired();
        builder.Property(n => n.Title).HasMaxLength(120).IsRequired();
        builder.Property(n => n.Body).HasMaxLength(500).IsRequired();
        builder.Property(n => n.Link).HasMaxLength(200);
        builder.HasIndex(n => new { n.UserId, n.ReadAt, n.CreatedAt });
    }
}
