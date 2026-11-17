using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DatingApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Sprint04Boosts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "PromotedUntil",
                table: "CandidateProfiles",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Boosts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StartsAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndsAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PaymentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    GrantedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Boosts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Boosts_CandidateProfiles_ProfileId",
                        column: x => x.ProfileId,
                        principalTable: "CandidateProfiles",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Boosts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Boosts_PaymentId",
                table: "Boosts",
                column: "PaymentId",
                unique: true,
                filter: "[PaymentId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Boosts_ProfileId_EndsAt",
                table: "Boosts",
                columns: new[] { "ProfileId", "EndsAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Boosts_UserId",
                table: "Boosts",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Boosts");

            migrationBuilder.DropColumn(
                name: "PromotedUntil",
                table: "CandidateProfiles");
        }
    }
}
