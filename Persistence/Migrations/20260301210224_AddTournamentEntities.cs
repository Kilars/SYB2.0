using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTournamentEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Tournaments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    BestOf = table.Column<int>(type: "int", nullable: false),
                    PlayerCount = table.Column<int>(type: "int", nullable: false),
                    WinnerUserId = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tournaments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TournamentMembers",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    TournamentId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    IsAdmin = table.Column<bool>(type: "bit", nullable: false),
                    Seed = table.Column<int>(type: "int", nullable: false),
                    DateJoined = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TournamentMembers", x => new { x.UserId, x.TournamentId });
                    table.ForeignKey(
                        name: "FK_TournamentMembers_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TournamentMembers_Tournaments_TournamentId",
                        column: x => x.TournamentId,
                        principalTable: "Tournaments",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "TournamentMatches",
                columns: table => new
                {
                    MatchNumber = table.Column<int>(type: "int", nullable: false),
                    TournamentId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Completed = table.Column<bool>(type: "bit", nullable: false),
                    BracketRound = table.Column<int>(type: "int", nullable: false),
                    BracketPosition = table.Column<int>(type: "int", nullable: false),
                    WinnerUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RegisteredTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PlayerOneUserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    PlayerTwoUserId = table.Column<string>(type: "nvarchar(450)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TournamentMatches", x => new { x.TournamentId, x.MatchNumber });
                    table.ForeignKey(
                        name: "FK_TournamentMatches_TournamentMembers_PlayerOneUserId_TournamentId",
                        columns: x => new { x.PlayerOneUserId, x.TournamentId },
                        principalTable: "TournamentMembers",
                        principalColumns: new[] { "UserId", "TournamentId" });
                    table.ForeignKey(
                        name: "FK_TournamentMatches_TournamentMembers_PlayerTwoUserId_TournamentId",
                        columns: x => new { x.PlayerTwoUserId, x.TournamentId },
                        principalTable: "TournamentMembers",
                        principalColumns: new[] { "UserId", "TournamentId" });
                    table.ForeignKey(
                        name: "FK_TournamentMatches_Tournaments_TournamentId",
                        column: x => x.TournamentId,
                        principalTable: "Tournaments",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "TournamentRounds",
                columns: table => new
                {
                    RoundNumber = table.Column<int>(type: "int", nullable: false),
                    MatchNumber = table.Column<int>(type: "int", nullable: false),
                    TournamentId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Completed = table.Column<bool>(type: "bit", nullable: false),
                    WinnerUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PlayerOneCharacterId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    PlayerTwoCharacterId = table.Column<string>(type: "nvarchar(450)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TournamentRounds", x => new { x.TournamentId, x.MatchNumber, x.RoundNumber });
                    table.ForeignKey(
                        name: "FK_TournamentRounds_Characters_PlayerOneCharacterId",
                        column: x => x.PlayerOneCharacterId,
                        principalTable: "Characters",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TournamentRounds_Characters_PlayerTwoCharacterId",
                        column: x => x.PlayerTwoCharacterId,
                        principalTable: "Characters",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TournamentRounds_TournamentMatches_TournamentId_MatchNumber",
                        columns: x => new { x.TournamentId, x.MatchNumber },
                        principalTable: "TournamentMatches",
                        principalColumns: new[] { "TournamentId", "MatchNumber" });
                });

            migrationBuilder.CreateIndex(
                name: "IX_TournamentMatches_PlayerOneUserId_TournamentId",
                table: "TournamentMatches",
                columns: new[] { "PlayerOneUserId", "TournamentId" });

            migrationBuilder.CreateIndex(
                name: "IX_TournamentMatches_PlayerTwoUserId_TournamentId",
                table: "TournamentMatches",
                columns: new[] { "PlayerTwoUserId", "TournamentId" });

            migrationBuilder.CreateIndex(
                name: "IX_TournamentMembers_TournamentId",
                table: "TournamentMembers",
                column: "TournamentId");

            migrationBuilder.CreateIndex(
                name: "IX_TournamentRounds_PlayerOneCharacterId",
                table: "TournamentRounds",
                column: "PlayerOneCharacterId");

            migrationBuilder.CreateIndex(
                name: "IX_TournamentRounds_PlayerTwoCharacterId",
                table: "TournamentRounds",
                column: "PlayerTwoCharacterId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TournamentRounds");

            migrationBuilder.DropTable(
                name: "TournamentMatches");

            migrationBuilder.DropTable(
                name: "TournamentMembers");

            migrationBuilder.DropTable(
                name: "Tournaments");
        }
    }
}
