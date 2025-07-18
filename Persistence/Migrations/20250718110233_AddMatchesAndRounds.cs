using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMatchesAndRounds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Matches",
                columns: table => new
                {
                    LeagueId = table.Column<string>(type: "TEXT", nullable: false),
                    MatchIndex = table.Column<int>(type: "INTEGER", nullable: false),
                    Split = table.Column<int>(type: "INTEGER", nullable: false),
                    Completed = table.Column<bool>(type: "INTEGER", nullable: false),
                    WinnerId = table.Column<string>(type: "TEXT", nullable: true),
                    RegisteredTime = table.Column<DateTime>(type: "TEXT", nullable: true),
                    PlayerOneUserId = table.Column<string>(type: "TEXT", nullable: false),
                    PlayerOneLeagueId = table.Column<string>(type: "TEXT", nullable: false),
                    PlayerTwoUserId = table.Column<string>(type: "TEXT", nullable: false),
                    PlayerTwoLeagueId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Matches", x => new { x.LeagueId, x.MatchIndex, x.Split });
                    table.ForeignKey(
                        name: "FK_Matches_LeagueMembers_PlayerOneUserId_PlayerOneLeagueId",
                        columns: x => new { x.PlayerOneUserId, x.PlayerOneLeagueId },
                        principalTable: "LeagueMembers",
                        principalColumns: new[] { "UserId", "LeagueId" },
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Matches_LeagueMembers_PlayerTwoUserId_PlayerTwoLeagueId",
                        columns: x => new { x.PlayerTwoUserId, x.PlayerTwoLeagueId },
                        principalTable: "LeagueMembers",
                        principalColumns: new[] { "UserId", "LeagueId" },
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Matches_Leagues_LeagueId",
                        column: x => x.LeagueId,
                        principalTable: "Leagues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Rounds",
                columns: table => new
                {
                    RoundNumber = table.Column<int>(type: "INTEGER", nullable: false),
                    MatchIndex = table.Column<int>(type: "INTEGER", nullable: false),
                    LeagueId = table.Column<string>(type: "TEXT", nullable: false),
                    Split = table.Column<int>(type: "INTEGER", nullable: false),
                    Completed = table.Column<bool>(type: "INTEGER", nullable: false),
                    WinnerId = table.Column<string>(type: "TEXT", nullable: true),
                    RegisteredTime = table.Column<DateTime>(type: "TEXT", nullable: true),
                    PlayerOneCharacterId = table.Column<string>(type: "TEXT", nullable: true),
                    PlayerTwoCharacterId = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rounds", x => new { x.LeagueId, x.MatchIndex, x.Split, x.RoundNumber });
                    table.ForeignKey(
                        name: "FK_Rounds_Matches_LeagueId_MatchIndex_Split",
                        columns: x => new { x.LeagueId, x.MatchIndex, x.Split },
                        principalTable: "Matches",
                        principalColumns: new[] { "LeagueId", "MatchIndex", "Split" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Matches_PlayerOneUserId_PlayerOneLeagueId",
                table: "Matches",
                columns: new[] { "PlayerOneUserId", "PlayerOneLeagueId" });

            migrationBuilder.CreateIndex(
                name: "IX_Matches_PlayerTwoUserId_PlayerTwoLeagueId",
                table: "Matches",
                columns: new[] { "PlayerTwoUserId", "PlayerTwoLeagueId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Rounds");

            migrationBuilder.DropTable(
                name: "Matches");
        }
    }
}
