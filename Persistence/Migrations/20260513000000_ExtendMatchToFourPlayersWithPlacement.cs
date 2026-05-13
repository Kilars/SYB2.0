using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ExtendMatchToFourPlayersWithPlacement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ─── TPH column disjunction ─────────────────────────────────────────────
            // The pre-existing shared "PlayerCount" column on Competitions was used only
            // by Tournament. With League.PlayerCount added in this migration, EF would
            // collide both subclass properties onto it. We disjoin via distinct column names.
            //
            // Step 1: Add BracketSize (Tournament's new physical column, NOT NULL)
            migrationBuilder.AddColumn<int>(
                name: "BracketSize",
                table: "Competitions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            // Step 2: Copy Tournament's existing PlayerCount data into BracketSize
            migrationBuilder.Sql(
                "UPDATE Competitions SET BracketSize = PlayerCount WHERE CompetitionType = 'Tournament'");

            // Step 3: Add LeaguePlayerCount (League's physical column, nullable)
            migrationBuilder.AddColumn<int>(
                name: "LeaguePlayerCount",
                table: "Competitions",
                type: "int",
                nullable: true);

            // Step 4: Backfill LeaguePlayerCount = 2 for pre-existing Active/Complete leagues.
            // Planned-status leagues (Status = 0) stay NULL and pick up the value on first activation.
            // Status is stored as int (CompetitionStatus enum): Planned=0, Active=1, Complete=2.
            migrationBuilder.Sql(
                "UPDATE Competitions SET LeaguePlayerCount = 2 WHERE CompetitionType = 'League' AND Status <> 0");

            // Step 5: Drop the old shared PlayerCount column (data already migrated to BracketSize)
            migrationBuilder.DropColumn(
                name: "PlayerCount",
                table: "Competitions");

            // ─── Match: new participant columns ─────────────────────────────────────
            migrationBuilder.AddColumn<int>(
                name: "PlayerCount",
                table: "Matches",
                type: "int",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.AddColumn<string>(
                name: "PlayerThreeUserId",
                table: "Matches",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlayerFourUserId",
                table: "Matches",
                type: "nvarchar(450)",
                nullable: true);

            // ─── Match: placement columns (plain strings, NOT FKs) ──────────────────
            migrationBuilder.AddColumn<string>(
                name: "SecondPlaceUserId",
                table: "Matches",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ThirdPlaceUserId",
                table: "Matches",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FourthPlaceUserId",
                table: "Matches",
                type: "nvarchar(max)",
                nullable: true);

            // ─── Round: new character columns ────────────────────────────────────────
            migrationBuilder.AddColumn<string>(
                name: "PlayerThreeCharacterId",
                table: "Rounds",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlayerFourCharacterId",
                table: "Rounds",
                type: "nvarchar(450)",
                nullable: true);

            // ─── Indexes for new composite participant FKs on Match ──────────────────
            migrationBuilder.CreateIndex(
                name: "IX_Matches_PlayerThreeUserId_CompetitionId",
                table: "Matches",
                columns: new[] { "PlayerThreeUserId", "CompetitionId" });

            migrationBuilder.CreateIndex(
                name: "IX_Matches_PlayerFourUserId_CompetitionId",
                table: "Matches",
                columns: new[] { "PlayerFourUserId", "CompetitionId" });

            // ─── Indexes for new character FKs on Round ──────────────────────────────
            migrationBuilder.CreateIndex(
                name: "IX_Rounds_PlayerThreeCharacterId",
                table: "Rounds",
                column: "PlayerThreeCharacterId");

            migrationBuilder.CreateIndex(
                name: "IX_Rounds_PlayerFourCharacterId",
                table: "Rounds",
                column: "PlayerFourCharacterId");

            // ─── FK constraints for new Match participant columns ────────────────────
            migrationBuilder.AddForeignKey(
                name: "FK_Matches_CompetitionMembers_PlayerThreeUserId_CompetitionId",
                table: "Matches",
                columns: new[] { "PlayerThreeUserId", "CompetitionId" },
                principalTable: "CompetitionMembers",
                principalColumns: new[] { "UserId", "CompetitionId" },
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_Matches_CompetitionMembers_PlayerFourUserId_CompetitionId",
                table: "Matches",
                columns: new[] { "PlayerFourUserId", "CompetitionId" },
                principalTable: "CompetitionMembers",
                principalColumns: new[] { "UserId", "CompetitionId" },
                onDelete: ReferentialAction.NoAction);

            // ─── FK constraints for new Round character columns ──────────────────────
            migrationBuilder.AddForeignKey(
                name: "FK_Rounds_Characters_PlayerThreeCharacterId",
                table: "Rounds",
                column: "PlayerThreeCharacterId",
                principalTable: "Characters",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_Rounds_Characters_PlayerFourCharacterId",
                table: "Rounds",
                column: "PlayerFourCharacterId",
                principalTable: "Characters",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            // ─── DB CHECK constraints on Match (paired-implication SQL) ─────────────
            // SQL Server has no boolean type, so all constraints use implication form.

            migrationBuilder.Sql(@"
                ALTER TABLE Matches ADD CONSTRAINT CK_Match_PlayerCount_Range
                  CHECK (PlayerCount BETWEEN 2 AND 4)");

            migrationBuilder.Sql(@"
                ALTER TABLE Matches ADD CONSTRAINT CK_Match_Participants_Consistent
                  CHECK (
                    ((PlayerCount >= 3 AND PlayerThreeUserId IS NOT NULL) OR (PlayerCount < 3 AND PlayerThreeUserId IS NULL))
                    AND
                    ((PlayerCount = 4 AND PlayerFourUserId IS NOT NULL) OR (PlayerCount < 4 AND PlayerFourUserId IS NULL))
                  )");

            migrationBuilder.Sql(@"
                ALTER TABLE Matches ADD CONSTRAINT CK_Match_PlacementsBounded
                  CHECK (
                    (PlayerCount >= 3 OR ThirdPlaceUserId IS NULL)
                    AND
                    (PlayerCount = 4 OR FourthPlaceUserId IS NULL)
                  )");

            migrationBuilder.Sql(@"
                ALTER TABLE Matches ADD CONSTRAINT CK_Match_Participants_Distinct
                  CHECK (
                    (PlayerOneUserId IS NULL OR PlayerTwoUserId IS NULL OR PlayerOneUserId <> PlayerTwoUserId)
                    AND (PlayerOneUserId IS NULL OR PlayerThreeUserId IS NULL OR PlayerOneUserId <> PlayerThreeUserId)
                    AND (PlayerOneUserId IS NULL OR PlayerFourUserId IS NULL OR PlayerOneUserId <> PlayerFourUserId)
                    AND (PlayerTwoUserId IS NULL OR PlayerThreeUserId IS NULL OR PlayerTwoUserId <> PlayerThreeUserId)
                    AND (PlayerTwoUserId IS NULL OR PlayerFourUserId IS NULL OR PlayerTwoUserId <> PlayerFourUserId)
                    AND (PlayerThreeUserId IS NULL OR PlayerFourUserId IS NULL OR PlayerThreeUserId <> PlayerFourUserId)
                  )");

            migrationBuilder.Sql(@"
                ALTER TABLE Matches ADD CONSTRAINT CK_Match_Placements_InParticipantSet
                  CHECK (
                    (SecondPlaceUserId IS NULL OR SecondPlaceUserId IN (PlayerOneUserId, PlayerTwoUserId, PlayerThreeUserId, PlayerFourUserId))
                    AND (ThirdPlaceUserId IS NULL OR ThirdPlaceUserId IN (PlayerOneUserId, PlayerTwoUserId, PlayerThreeUserId, PlayerFourUserId))
                    AND (FourthPlaceUserId IS NULL OR FourthPlaceUserId IN (PlayerOneUserId, PlayerTwoUserId, PlayerThreeUserId, PlayerFourUserId))
                  )");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // ─── Drop CHECK constraints ───────────────────────────────────────────────
            migrationBuilder.Sql("ALTER TABLE Matches DROP CONSTRAINT CK_Match_Placements_InParticipantSet");
            migrationBuilder.Sql("ALTER TABLE Matches DROP CONSTRAINT CK_Match_Participants_Distinct");
            migrationBuilder.Sql("ALTER TABLE Matches DROP CONSTRAINT CK_Match_PlacementsBounded");
            migrationBuilder.Sql("ALTER TABLE Matches DROP CONSTRAINT CK_Match_Participants_Consistent");
            migrationBuilder.Sql("ALTER TABLE Matches DROP CONSTRAINT CK_Match_PlayerCount_Range");

            // ─── Drop FK constraints ──────────────────────────────────────────────────
            migrationBuilder.DropForeignKey(
                name: "FK_Rounds_Characters_PlayerFourCharacterId",
                table: "Rounds");

            migrationBuilder.DropForeignKey(
                name: "FK_Rounds_Characters_PlayerThreeCharacterId",
                table: "Rounds");

            migrationBuilder.DropForeignKey(
                name: "FK_Matches_CompetitionMembers_PlayerFourUserId_CompetitionId",
                table: "Matches");

            migrationBuilder.DropForeignKey(
                name: "FK_Matches_CompetitionMembers_PlayerThreeUserId_CompetitionId",
                table: "Matches");

            // ─── Drop indexes ─────────────────────────────────────────────────────────
            migrationBuilder.DropIndex(
                name: "IX_Rounds_PlayerFourCharacterId",
                table: "Rounds");

            migrationBuilder.DropIndex(
                name: "IX_Rounds_PlayerThreeCharacterId",
                table: "Rounds");

            migrationBuilder.DropIndex(
                name: "IX_Matches_PlayerFourUserId_CompetitionId",
                table: "Matches");

            migrationBuilder.DropIndex(
                name: "IX_Matches_PlayerThreeUserId_CompetitionId",
                table: "Matches");

            // ─── Drop new columns ─────────────────────────────────────────────────────
            migrationBuilder.DropColumn(name: "PlayerFourCharacterId", table: "Rounds");
            migrationBuilder.DropColumn(name: "PlayerThreeCharacterId", table: "Rounds");

            migrationBuilder.DropColumn(name: "FourthPlaceUserId", table: "Matches");
            migrationBuilder.DropColumn(name: "ThirdPlaceUserId", table: "Matches");
            migrationBuilder.DropColumn(name: "SecondPlaceUserId", table: "Matches");
            migrationBuilder.DropColumn(name: "PlayerFourUserId", table: "Matches");
            migrationBuilder.DropColumn(name: "PlayerThreeUserId", table: "Matches");
            migrationBuilder.DropColumn(name: "PlayerCount", table: "Matches");

            // ─── Reverse TPH column disjunction ──────────────────────────────────────
            // Re-add shared PlayerCount column and restore Tournament data into it.
            migrationBuilder.AddColumn<int>(
                name: "PlayerCount",
                table: "Competitions",
                type: "int",
                nullable: true);

            migrationBuilder.Sql(
                "UPDATE Competitions SET PlayerCount = BracketSize WHERE CompetitionType = 'Tournament'");

            migrationBuilder.DropColumn(name: "LeaguePlayerCount", table: "Competitions");
            migrationBuilder.DropColumn(name: "BracketSize", table: "Competitions");
        }
    }
}
