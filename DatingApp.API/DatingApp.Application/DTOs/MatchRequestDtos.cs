namespace DatingApp.Application.DTOs;

public class CreateMatchRequestDto
{
    public Guid ReceiverProfileId { get; set; }
    public string? Note { get; set; }
}

public class MatchRequestDto
{
    public Guid Id { get; set; }
    public Guid SenderProfileId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string SenderProfession { get; set; } = string.Empty;
    public string SenderPhotoUrl { get; set; } = string.Empty;
    
    public Guid ReceiverProfileId { get; set; }
    public string ReceiverName { get; set; } = string.Empty;

    public string Status { get; set; } = "Pending";
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RespondMatchRequestDto
{
    public bool Accept { get; set; }
}

