using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTournamentPerHeatPlayerCount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Per-heat player count for Tournament (TPH on Competitions).
            // NOT NULL DEFAULT 2 — the DEFAULT also backfills all existing rows to 2,
            // which is correct because every pre-existing tournament was N=2 (Bo3).
            migrationBuilder.AddColumn<int>(
                name: "PerHeatPlayerCount",
                table: "Competitions",
                type: "int",
                nullable: false,
                defaultValue: 2);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PerHeatPlayerCount",
                table: "Competitions");
        }
    }
}
