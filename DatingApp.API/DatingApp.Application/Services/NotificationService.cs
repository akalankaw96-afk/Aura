using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>In-app notifications, optionally also sent by SMS (S02-T12).</summary>
public interface INotificationService
{
    /// <summary>Adds the notification to the context (the caller saves) and sends the SMS when asked.</summary>
    Task NotifyAsync(Guid userId, string type, string title, string body, string? link, bool sms, CancellationToken ct = default);
    Task<List<NotificationDto>> ListAsync(Guid userId, int take, CancellationToken ct = default);
    Task<int> UnreadCountAsync(Guid userId, CancellationToken ct = default);
    Task MarkReadAsync(Guid userId, Guid notificationId, CancellationToken ct = default);
    Task MarkAllReadAsync(Guid userId, CancellationToken ct = default);
}

public class NotificationService : INotificationService
{
    private readonly IApplicationDbContext _context;
    private readonly ISmsSender _sms;

    public NotificationService(IApplicationDbContext context, ISmsSender sms)
    {
        _context = context;
        _sms = sms;
    }

    public async Task NotifyAsync(Guid userId, string type, string title, string body, string? link, bool sms, CancellationToken ct = default)
    {
        _context.Notifications.Add(new Notification { UserId = userId, Type = type, Title = title, Body = body, Link = link });

        if (!sms) return;
        var phone = await _context.Users.Where(u => u.Id == userId).Select(u => u.PhoneNumber).FirstOrDefaultAsync(ct);
        if (!string.IsNullOrEmpty(phone)) await _sms.SendAsync(phone, $"Vikasitha: {body}", ct);
    }

    public async Task<List<NotificationDto>> ListAsync(Guid userId, int take, CancellationToken ct = default)
    {
        take = Math.Clamp(take, 1, 100);
        return await _context.Notifications.AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(take)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Type = n.Type,
                Title = n.Title,
                Body = n.Body,
                Link = n.Link,
                IsRead = n.ReadAt != null,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync(ct);
    }

    public Task<int> UnreadCountAsync(Guid userId, CancellationToken ct = default) =>
        _context.Notifications.CountAsync(n => n.UserId == userId && n.ReadAt == null, ct);

    public async Task MarkReadAsync(Guid userId, Guid notificationId, CancellationToken ct = default)
    {
        var n = await _context.Notifications.FirstOrDefaultAsync(x => x.Id == notificationId && x.UserId == userId, ct)
            ?? throw AppException.NotFound("Notification not found.");
        n.ReadAt ??= DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
    }

    public async Task MarkAllReadAsync(Guid userId, CancellationToken ct = default)
    {
        var unread = await _context.Notifications.Where(n => n.UserId == userId && n.ReadAt == null).ToListAsync(ct);
        var now = DateTime.UtcNow;
        foreach (var n in unread) n.ReadAt = now;
        await _context.SaveChangesAsync(ct);
    }
}
