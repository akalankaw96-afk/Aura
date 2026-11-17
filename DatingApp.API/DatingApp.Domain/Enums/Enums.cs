namespace DatingApp.Domain.Enums;

public enum Gender
{
    Female = 1,
    Male = 2
}

public enum ProfessionCategory
{
    Doctor = 1,
    Engineer = 2,
    IT = 3,
    Finance = 4,
    Legal = 5,
    Business = 6,
    Other = 7
}

public enum MatchRequestStatus
{
    Pending = 1,
    Accepted = 2,
    Declined = 3,
    /// <summary>The sender took the interest back before it was answered (S03-T05).</summary>
    Withdrawn = 4
}


/// <summary>Where a profile is in the review journey (S02-T01). Only moderators move it to Approved / ChangesRequested / Suspended.</summary>
public enum ProfileStatus
{
    Draft = 0,
    Submitted = 1,
    ChangesRequested = 2,
    Resubmitted = 3,
    Approved = 4,
    Suspended = 5
}

public enum ReviewItemStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

public enum KycDocumentType
{
    NicFront = 1,
    NicBack = 2,
    Passport = 3,
    Selfie = 4
}

public enum ReviewAction
{
    Approved = 1,
    ChangesRequested = 2,
    Suspended = 3,
    PhotoApproved = 4,
    PhotoRejected = 5,
    DocumentViewed = 6,
    Reinstated = 7,
    /// <summary>A report about this profile was dismissed (S03-T08).</summary>
    ReportDismissed = 8,
    /// <summary>A report about this profile was acted on (S03-T08).</summary>
    ReportActioned = 9
}

/// <summary>Things a plan can limit per month (S03-T02). Stored as numbers — never renumber.</summary>
public enum UsageFeature
{
    Search = 1,
    ProfileView = 2,
    Interest = 3,
    NewChat = 4
}

/// <summary>Why a member was reported (S03-T07).</summary>
public enum ReportReason
{
    Scam = 1,           // asked for money or bank details
    Inappropriate = 2,  // rude or inappropriate messages
    FakeProfile = 3,    // fake or misleading profile
    Other = 4
}

public enum ReportStatus
{
    Open = 1,
    Dismissed = 2,
    Actioned = 3
}

/// <summary>What a price or payment is for (S04). Stored as numbers — never renumber.</summary>
public enum BillingProduct
{
    Plan = 1,
    Boost = 2
}

public enum SubscriptionStatus
{
    Active = 1,
    Expired = 2,
    Cancelled = 3
}
