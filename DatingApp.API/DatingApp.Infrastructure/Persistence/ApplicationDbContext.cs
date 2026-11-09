using DatingApp.Application.Common.Interfaces;
using DatingApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<CandidateProfile> CandidateProfiles => Set<CandidateProfile>();
    public DbSet<MatchRequest> MatchRequests => Set<MatchRequest>();
    public DbSet<SuccessStory> SuccessStories => Set<SuccessStory>();
    public DbSet<PricingPlan> PricingPlans => Set<PricingPlan>();
    public DbSet<FaqItem> FaqItems => Set<FaqItem>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User - CandidateProfile (1:1)
        modelBuilder.Entity<User>()
            .HasOne(u => u.Profile)
            .WithOne(p => p.User)
            .HasForeignKey<CandidateProfile>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // CandidateProfile - MatchRequests (Sent)
        modelBuilder.Entity<MatchRequest>()
            .HasOne(m => m.SenderProfile)
            .WithMany(p => p.SentMatchRequests)
            .HasForeignKey(m => m.SenderProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        // CandidateProfile - MatchRequests (Received)
        modelBuilder.Entity<MatchRequest>()
            .HasOne(m => m.ReceiverProfile)
            .WithMany(p => p.ReceivedMatchRequests)
            .HasForeignKey(m => m.ReceiverProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        // CandidateProfile - ChatMessages (Sender)
        modelBuilder.Entity<ChatMessage>()
            .HasOne(c => c.SenderProfile)
            .WithMany()
            .HasForeignKey(c => c.SenderProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        // CandidateProfile - ChatMessages (Receiver)
        modelBuilder.Entity<ChatMessage>()
            .HasOne(c => c.ReceiverProfile)
            .WithMany()
            .HasForeignKey(c => c.ReceiverProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<CandidateProfile>()
            .HasIndex(p => p.Code)
            .IsUnique();

        modelBuilder.Entity<ChatMessage>()
            .HasIndex(c => c.ConversationId);
    }
}

