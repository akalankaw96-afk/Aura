using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Common.Interfaces;
using DatingApp.Application.Common.Security;
using DatingApp.Application.DTOs;
using DatingApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Application.Services;

/// <summary>Admin-only staff management (S02-T08). Admins are created only from configuration, never through the API.</summary>
public interface IStaffService
{
    Task<List<StaffUserDto>> ListStaffAsync(CancellationToken ct = default);
    Task<StaffUserDto?> FindByPhoneAsync(string phone, CancellationToken ct = default);
    Task<StaffUserDto> ChangeRoleAsync(Guid adminUserId, Guid userId, string role, CancellationToken ct = default);
}

public class StaffService : IStaffService
{
    private readonly IApplicationDbContext _context;

    public StaffService(IApplicationDbContext context)
    {
        _context = context;
    }

    public Task<List<StaffUserDto>> ListStaffAsync(CancellationToken ct = default) =>
        _context.Users.AsNoTracking()
            .Where(u => u.Role == Roles.Admin || u.Role == Roles.Moderator)
            .OrderBy(u => u.Role).ThenBy(u => u.FullName)
            .Select(u => new StaffUserDto { UserId = u.Id, FullName = u.FullName, PhoneNumber = u.PhoneNumber, Email = u.Email, Role = u.Role })
            .ToListAsync(ct);

    public async Task<StaffUserDto?> FindByPhoneAsync(string phone, CancellationToken ct = default)
    {
        var normalized = Identifiers.RequirePhone(phone, "phone");
        return await _context.Users.AsNoTracking()
            .Where(u => u.PhoneNumber == normalized)
            .Select(u => new StaffUserDto { UserId = u.Id, FullName = u.FullName, PhoneNumber = u.PhoneNumber, Email = u.Email, Role = u.Role })
            .FirstOrDefaultAsync(ct);
    }

    public async Task<StaffUserDto> ChangeRoleAsync(Guid adminUserId, Guid userId, string role, CancellationToken ct = default)
    {
        var target = (role ?? string.Empty).Trim();
        if (!string.Equals(target, Roles.Member, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(target, Roles.Moderator, StringComparison.OrdinalIgnoreCase))
            throw AppException.Validation("Role can be Member or Moderator.", "role");
        target = string.Equals(target, Roles.Moderator, StringComparison.OrdinalIgnoreCase) ? Roles.Moderator : Roles.Member;

        if (userId == adminUserId) throw AppException.Forbidden("You can't change your own role.");
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct) ?? throw AppException.NotFound("Member not found.");
        if (user.Role == Roles.Admin) throw AppException.Forbidden("Admins are managed in the server settings.");

        if (user.Role != target)
        {
            user.Role = target;
            user.SecurityStamp = Guid.NewGuid().ToString("N");
            user.UpdatedAt = DateTime.UtcNow;
            // the role lives in the access token: end existing sessions so the change applies at once
            var tokens = await _context.RefreshTokens.Where(t => t.UserId == userId && t.RevokedAt == null).ToListAsync(ct);
            foreach (var t in tokens) t.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);
        }

        return new StaffUserDto { UserId = user.Id, FullName = user.FullName, PhoneNumber = user.PhoneNumber, Email = user.Email, Role = user.Role };
    }
}
