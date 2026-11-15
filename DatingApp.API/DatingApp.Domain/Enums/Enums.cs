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
    Declined = 3
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
    Reinstated = 7
}
