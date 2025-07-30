using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MakeCharacterFKOpt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Rounds_Characters_PlayerOneCharacterId",
                table: "Rounds");

            migrationBuilder.DropForeignKey(
                name: "FK_Rounds_Characters_PlayerTwoCharacterId",
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

            migrationBuilder.AddForeignKey(
                name: "FK_Rounds_Characters_PlayerOneCharacterId",
                table: "Rounds",
                column: "PlayerOneCharacterId",
                principalTable: "Characters",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Rounds_Characters_PlayerTwoCharacterId",
                table: "Rounds",
                column: "PlayerTwoCharacterId",
                principalTable: "Characters",
                principalColumn: "Id");
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
    }
}
