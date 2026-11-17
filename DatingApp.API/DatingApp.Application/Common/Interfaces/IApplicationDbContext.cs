using DatingApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<CandidateProfile> CandidateProfiles { get; }
    DbSet<MatchRequest> MatchRequests { get; }
    DbSet<SuccessStory> SuccessStories { get; }
    DbSet<PricingPlan> PricingPlans { get; }
    DbSet<FaqItem> FaqItems { get; }
    DbSet<ChatMessage> ChatMessages { get; }

    // Auth (S01)
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<OtpCode> OtpCodes { get; }
    DbSet<PasswordResetToken> PasswordResetTokens { get; }

    // Review (S02)
    DbSet<ProfilePhoto> ProfilePhotos { get; }
    DbSet<KycDocument> KycDocuments { get; }
    DbSet<ProfileReviewFlag> ProfileReviewFlags { get; }
    DbSet<ProfileReviewLog> ProfileReviewLogs { get; }
    DbSet<Notification> Notifications { get; }

    // Plans & usage (S03)
    DbSet<PlanLimit> PlanLimits { get; }
    DbSet<UsageCounter> UsageCounters { get; }
    DbSet<ProfileView> ProfileViews { get; }
    DbSet<Shortlist> Shortlists { get; }
    DbSet<SavedSearch> SavedSearches { get; }
    DbSet<Block> Blocks { get; }
    DbSet<Report> Reports { get; }
    DbSet<PlanPrice> PlanPrices { get; }
    DbSet<Subscription> Subscriptions { get; }
    DbSet<Payment> Payments { get; }
    DbSet<Boost> Boosts { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<AccountClosureFeedback> AccountClosureFeedback { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
