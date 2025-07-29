using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCharacter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "PlayerTwoCharacterId",
                table: "Rounds",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PlayerOneCharacterId",
                table: "Rounds",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "Characters",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    FullName = table.Column<string>(type: "TEXT", nullable: false),
                    ShorthandName = table.Column<string>(type: "TEXT", nullable: false),
                    ImageUrl = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Characters", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Rounds_PlayerOneCharacterId",
                table: "Rounds",
                column: "PlayerOneCharacterId");

            migrationBuilder.CreateIndex(
                name: "IX_Rounds_PlayerTwoCharacterId",
                table: "Rounds",
                column: "PlayerTwoCharacterId");

            migrationBuilder.AddForeignKey(
                name: "FK_Rounds_Characters_PlayerOneCharacterId",
                table: "Rounds",
                column: "PlayerOneCharacterId",
                principalTable: "Characters",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Rounds_Characters_PlayerTwoCharacterId",
                table: "Rounds",
                column: "PlayerTwoCharacterId",
                principalTable: "Characters",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Rounds_Characters_PlayerOneCharacterId",
                table: "Rounds");

            migrationBuilder.DropForeignKey(
                name: "FK_Rounds_Characters_PlayerTwoCharacterId",
                table: "Rounds");

            migrationBuilder.DropTable(
                name: "Characters");

            migrationBuilder.DropIndex(
                name: "IX_Rounds_PlayerOneCharacterId",
                table: "Rounds");

            migrationBuilder.DropIndex(
                name: "IX_Rounds_PlayerTwoCharacterId",
                table: "Rounds");

            migrationBuilder.AlterColumn<string>(
                name: "PlayerTwoCharacterId",
                table: "Rounds",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AlterColumn<string>(
                name: "PlayerOneCharacterId",
                table: "Rounds",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");
        }
    }
}
