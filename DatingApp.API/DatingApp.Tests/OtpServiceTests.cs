using DatingApp.Application.Common.Exceptions;
using DatingApp.Application.Services;
using DatingApp.Domain.Enums;

namespace DatingApp.Tests;

public class OtpServiceTests
{
    private const string Phone = "+94771234567";

    [Fact]
    public async Task Code_sent_by_sms_verifies_once()
    {
        using var db = TestDb.Create();
        var sms = new CapturingSmsSender();
        var otp = new OtpService(db, sms, new NoEmailSender());

        var sent = await otp.IssueAsync(OtpPurpose.VerifyPhone, OtpChannel.Phone, Phone, null, deliver: true);

        Assert.True(sent.Success);
        Assert.Matches(@"^\d{6}$", sms.LastCode);

        var verified = await otp.VerifyAsync(OtpPurpose.VerifyPhone, Phone, sms.LastCode);
        Assert.NotNull(verified.ConsumedAt);

        // a used code cannot be used again
        var again = await Assert.ThrowsAsync<AppException>(() => otp.VerifyAsync(OtpPurpose.VerifyPhone, Phone, sms.LastCode));
        Assert.Equal(ErrorCodes.CodeExpired, again.Code);
    }

    [Fact]
    public async Task Code_is_never_stored_in_plain_text()
    {
        using var db = TestDb.Create();
        var sms = new CapturingSmsSender();
        var otp = new OtpService(db, sms, new NoEmailSender());

        await otp.IssueAsync(OtpPurpose.VerifyPhone, OtpChannel.Phone, Phone, null, deliver: true);

        var stored = Assert.Single(db.OtpCodes);
        Assert.NotEqual(sms.LastCode, stored.CodeHash);
        Assert.Equal(64, stored.CodeHash.Length);
    }

    [Fact]
    public async Task Wrong_code_counts_down_then_locks()
    {
        using var db = TestDb.Create();
        var sms = new CapturingSmsSender();
        var otp = new OtpService(db, sms, new NoEmailSender());
        await otp.IssueAsync(OtpPurpose.VerifyPhone, OtpChannel.Phone, Phone, null, deliver: true);
        var wrong = sms.LastCode == "000000" ? "111111" : "000000";

        var first = await Assert.ThrowsAsync<AppException>(() => otp.VerifyAsync(OtpPurpose.VerifyPhone, Phone, wrong));
        Assert.Equal(ErrorCodes.CodeInvalid, first.Code);
        Assert.Equal(4, first.Extensions["attemptsLeft"]);

        for (var i = 0; i < 3; i++)
            await Assert.ThrowsAsync<AppException>(() => otp.VerifyAsync(OtpPurpose.VerifyPhone, Phone, wrong));

        var last = await Assert.ThrowsAsync<AppException>(() => otp.VerifyAsync(OtpPurpose.VerifyPhone, Phone, wrong));
        Assert.Equal(ErrorCodes.TooManyAttempts, last.Code);

        // even the right code is refused once locked
        var locked = await Assert.ThrowsAsync<AppException>(() => otp.VerifyAsync(OtpPurpose.VerifyPhone, Phone, sms.LastCode));
        Assert.Equal(ErrorCodes.TooManyAttempts, locked.Code);
    }

    [Fact]
    public async Task Resend_within_60_seconds_is_rate_limited()
    {
        using var db = TestDb.Create();
        var otp = new OtpService(db, new CapturingSmsSender(), new NoEmailSender());
        await otp.IssueAsync(OtpPurpose.VerifyPhone, OtpChannel.Phone, Phone, null, deliver: true);

        var ex = await Assert.ThrowsAsync<AppException>(() =>
            otp.IssueAsync(OtpPurpose.VerifyPhone, OtpChannel.Phone, Phone, null, deliver: true));

        Assert.Equal(429, ex.Status);
        Assert.Equal(ErrorCodes.RateLimited, ex.Code);
    }
}
