using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RefacorCompositeKeyAndMemberFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Matches_LeagueMembers_PlayerOneUserId_PlayerOneLeagueId",
                table: "Matches");

            migrationBuilder.DropForeignKey(
                name: "FK_Matches_LeagueMembers_PlayerTwoUserId_PlayerTwoLeagueId",
                table: "Matches");

            migrationBuilder.DropForeignKey(
                name: "FK_Rounds_Matches_LeagueId_MatchIndex_Split",
                table: "Rounds");

            migrationBuilder.DropIndex(
                name: "IX_Matches_PlayerOneUserId_PlayerOneLeagueId",
                table: "Matches");

            migrationBuilder.DropIndex(
                name: "IX_Matches_PlayerTwoUserId_PlayerTwoLeagueId",
                table: "Matches");

            migrationBuilder.DropColumn(
                name: "PlayerOneLeagueId",
                table: "Matches");

            migrationBuilder.DropColumn(
                name: "PlayerTwoLeagueId",
                table: "Matches");

            migrationBuilder.DropColumn(
                name: "DisplayName",
                table: "LeagueMembers");

            migrationBuilder.RenameColumn(
                name: "MatchIndex",
                table: "Rounds",
                newName: "MatchNumber");

            migrationBuilder.RenameColumn(
                name: "MatchIndex",
                table: "Matches",
                newName: "MatchNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Matches_PlayerOneUserId_LeagueId",
                table: "Matches",
                columns: new[] { "PlayerOneUserId", "LeagueId" });

            migrationBuilder.CreateIndex(
                name: "IX_Matches_PlayerTwoUserId_LeagueId",
                table: "Matches",
                columns: new[] { "PlayerTwoUserId", "LeagueId" });

            migrationBuilder.AddForeignKey(
                name: "FK_Matches_LeagueMembers_PlayerOneUserId_LeagueId",
                table: "Matches",
                columns: new[] { "PlayerOneUserId", "LeagueId" },
                principalTable: "LeagueMembers",
                principalColumns: new[] { "UserId", "LeagueId" });

            migrationBuilder.AddForeignKey(
                name: "FK_Matches_LeagueMembers_PlayerTwoUserId_LeagueId",
                table: "Matches",
                columns: new[] { "PlayerTwoUserId", "LeagueId" },
                principalTable: "LeagueMembers",
                principalColumns: new[] { "UserId", "LeagueId" });

            migrationBuilder.AddForeignKey(
                name: "FK_Rounds_Matches_LeagueId_MatchNumber_Split",
                table: "Rounds",
                columns: new[] { "LeagueId", "MatchNumber", "Split" },
                principalTable: "Matches",
                principalColumns: new[] { "LeagueId", "MatchNumber", "Split" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Matches_LeagueMembers_PlayerOneUserId_LeagueId",
                table: "Matches");

            migrationBuilder.DropForeignKey(
                name: "FK_Matches_LeagueMembers_PlayerTwoUserId_LeagueId",
                table: "Matches");

            migrationBuilder.DropForeignKey(
                name: "FK_Rounds_Matches_LeagueId_MatchNumber_Split",
                table: "Rounds");

            migrationBuilder.DropIndex(
                name: "IX_Matches_PlayerOneUserId_LeagueId",
                table: "Matches");

            migrationBuilder.DropIndex(
                name: "IX_Matches_PlayerTwoUserId_LeagueId",
                table: "Matches");

            migrationBuilder.RenameColumn(
                name: "MatchNumber",
                table: "Rounds",
                newName: "MatchIndex");

            migrationBuilder.RenameColumn(
                name: "MatchNumber",
                table: "Matches",
                newName: "MatchIndex");

            migrationBuilder.AddColumn<string>(
                name: "PlayerOneLeagueId",
                table: "Matches",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PlayerTwoLeagueId",
                table: "Matches",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DisplayName",
                table: "LeagueMembers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Matches_PlayerOneUserId_PlayerOneLeagueId",
                table: "Matches",
                columns: new[] { "PlayerOneUserId", "PlayerOneLeagueId" });

            migrationBuilder.CreateIndex(
                name: "IX_Matches_PlayerTwoUserId_PlayerTwoLeagueId",
                table: "Matches",
                columns: new[] { "PlayerTwoUserId", "PlayerTwoLeagueId" });

            migrationBuilder.AddForeignKey(
                name: "FK_Matches_LeagueMembers_PlayerOneUserId_PlayerOneLeagueId",
                table: "Matches",
                columns: new[] { "PlayerOneUserId", "PlayerOneLeagueId" },
                principalTable: "LeagueMembers",
                principalColumns: new[] { "UserId", "LeagueId" });

            migrationBuilder.AddForeignKey(
                name: "FK_Matches_LeagueMembers_PlayerTwoUserId_PlayerTwoLeagueId",
                table: "Matches",
                columns: new[] { "PlayerTwoUserId", "PlayerTwoLeagueId" },
                principalTable: "LeagueMembers",
                principalColumns: new[] { "UserId", "LeagueId" });

            migrationBuilder.AddForeignKey(
                name: "FK_Rounds_Matches_LeagueId_MatchIndex_Split",
                table: "Rounds",
                columns: new[] { "LeagueId", "MatchIndex", "Split" },
                principalTable: "Matches",
                principalColumns: new[] { "LeagueId", "MatchIndex", "Split" });
        }
    }
}
