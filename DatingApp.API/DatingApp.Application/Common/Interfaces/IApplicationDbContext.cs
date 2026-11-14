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

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
