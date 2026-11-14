using DatingApp.Application.DTOs;
using DatingApp.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DatingApp.WebApi.Controllers;

/// <summary>Chat history for the signed-in member (S01-T06). Sending happens over the hub.</summary>
[Authorize]
public class ChatController : BaseApiController
{
    private readonly IChatService _chat;

    public ChatController(IChatService chat)
    {
        _chat = chat;
    }

    /// <summary>The caller's conversations — one per accepted match.</summary>
    [HttpGet("conversations")]
    [ProducesResponseType(typeof(List<ConversationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetConversations(CancellationToken ct) =>
        Ok(await _chat.GetConversationsAsync(RequireUserId(), ct));

    /// <summary>Messages in one of the caller's conversations (404 if the caller is not part of it).</summary>
    [HttpGet("history/{conversationId}")]
    [ProducesResponseType(typeof(List<ChatMessageDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetHistory(string conversationId, CancellationToken ct) =>
        Ok(await _chat.GetHistoryAsync(RequireUserId(), conversationId, ct));
}
