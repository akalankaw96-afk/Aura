using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DatingApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Sprint03Usage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PlanLimits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PlanId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Feature = table.Column<int>(type: "int", nullable: false),
                    MonthlyLimit = table.Column<int>(type: "int", nullable: true),
                    UpdatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanLimits", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UsageCounters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Feature = table.Column<int>(type: "int", nullable: false),
                    PeriodStart = table.Column<DateOnly>(type: "date", nullable: false),
                    Count = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsageCounters", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CandidateProfiles_Status_CreatedAt",
                table: "CandidateProfiles",
                columns: new[] { "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_CandidateProfiles_Status_Gender_DateOfBirth",
                table: "CandidateProfiles",
                columns: new[] { "Status", "Gender", "DateOfBirth" });

            migrationBuilder.CreateIndex(
                name: "IX_PlanLimits_PlanId_Feature",
                table: "PlanLimits",
                columns: new[] { "PlanId", "Feature" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UsageCounters_UserId_Feature_PeriodStart",
                table: "UsageCounters",
                columns: new[] { "UserId", "Feature", "PeriodStart" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlanLimits");

            migrationBuilder.DropTable(
                name: "UsageCounters");

            migrationBuilder.DropIndex(
                name: "IX_CandidateProfiles_Status_CreatedAt",
                table: "CandidateProfiles");

            migrationBuilder.DropIndex(
                name: "IX_CandidateProfiles_Status_Gender_DateOfBirth",
                table: "CandidateProfiles");
        }
    }
}
