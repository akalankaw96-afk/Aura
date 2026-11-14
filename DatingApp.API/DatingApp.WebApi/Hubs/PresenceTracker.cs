using System.Collections.Concurrent;
using DatingApp.Application.Common.Interfaces;

namespace DatingApp.WebApi.Hubs;

/// <summary>
/// Counts open chat connections per user. In-memory, so it only works with one API server;
/// move to Redis (or a SignalR backplane) before scaling out — TD-23.
/// </summary>
public class PresenceTracker : IPresenceTracker
{
    private readonly ConcurrentDictionary<Guid, HashSet<string>> _connections = new();

    public bool Connected(Guid userId, string connectionId)
    {
        var set = _connections.GetOrAdd(userId, _ => new HashSet<string>());
        lock (set)
        {
            set.Add(connectionId);
            return set.Count == 1;
        }
    }

    public bool Disconnected(Guid userId, string connectionId)
    {
        if (!_connections.TryGetValue(userId, out var set)) return false;
        lock (set)
        {
            set.Remove(connectionId);
            if (set.Count > 0) return false;
            _connections.TryRemove(new KeyValuePair<Guid, HashSet<string>>(userId, set));
            return true;
        }
    }

    public bool IsOnline(Guid userId) =>
        _connections.TryGetValue(userId, out var set) && set.Count > 0;
}
