namespace DatingApp.Application.Common.Interfaces;

/// <summary>Who has the chat open right now (in-memory, single server — see TECHNICAL_DEBT.md).</summary>
public interface IPresenceTracker
{
    /// <summary>Returns true when this is the user's first open connection.</summary>
    bool Connected(Guid userId, string connectionId);

    /// <summary>Returns true when this was the user's last open connection.</summary>
    bool Disconnected(Guid userId, string connectionId);

    bool IsOnline(Guid userId);
}
