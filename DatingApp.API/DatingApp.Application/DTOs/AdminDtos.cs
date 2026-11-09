namespace DatingApp.Application.DTOs;

public class AdminDashboardStatsDto
{
    public int PendingModerationCount { get; set; }
    public int SafetyFlagsCount { get; set; }
    public int UnverifiedSlipsCount { get; set; }
    public int OpenTicketsCount { get; set; }
    public int TotalUsersCount { get; set; }
    public decimal TotalRevenueLkr { get; set; }
}

public class PendingProfileAdminDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public int Age { get; set; }
    public string Profession { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Religion { get; set; } = string.Empty;
    public string NicNumber { get; set; } = string.Empty;
    public string NicPhotoUrl { get; set; } = string.Empty;
    public string ProfilePhotoUrl { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string SubmittedAt { get; set; } = string.Empty;
    public string Status { get; set; } = "pending"; // pending, approved, rejected
}

public class SafetyReportAdminDto
{
    public string Id { get; set; } = string.Empty;
    public string ReporterId { get; set; } = string.Empty;
    public string ReportedUserId { get; set; } = string.Empty;
    public string ReportedUserName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string Snippet { get; set; } = string.Empty;
    public string RiskLevel { get; set; } = "Medium"; // High, Medium, Low
    public string ReportedAt { get; set; } = string.Empty;
    public string Status { get; set; } = "open"; // open, warned, banned, dismissed
}

public class FinanceSlipAdminDto
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string PlanId { get; set; } = "gold"; // gold, platinum
    public int DurationMonths { get; set; }
    public decimal AmountLkr { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string ReferenceNumber { get; set; } = string.Empty;
    public string SlipUrl { get; set; } = string.Empty;
    public string SubmittedAt { get; set; } = string.Empty;
    public string Status { get; set; } = "pending"; // pending, approved, rejected
}

public class SupportTicketAdminDto
{
    public string Id { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public string Priority { get; set; } = "Normal"; // High, Normal
    public string Status { get; set; } = "open"; // open, resolved
    public string CreatedAt { get; set; } = string.Empty;
}

public class AuditLogEntryDto
{
    public string Id { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
    public string StaffName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
}

public class RejectReasonRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class AdminActionResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}

