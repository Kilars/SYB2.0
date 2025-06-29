using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MapMemberToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LeagueMembers_Leagues_LeagueId",
                table: "LeagueMembers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_LeagueMembers",
                table: "LeagueMembers");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "LeagueMembers",
                newName: "UserId");

            migrationBuilder.AlterColumn<string>(
                name: "LeagueId",
                table: "LeagueMembers",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_LeagueMembers",
                table: "LeagueMembers",
                columns: new[] { "UserId", "LeagueId" });

            migrationBuilder.AddForeignKey(
                name: "FK_LeagueMembers_AspNetUsers_UserId",
                table: "LeagueMembers",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_LeagueMembers_Leagues_LeagueId",
                table: "LeagueMembers",
                column: "LeagueId",
                principalTable: "Leagues",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LeagueMembers_AspNetUsers_UserId",
                table: "LeagueMembers");

            migrationBuilder.DropForeignKey(
                name: "FK_LeagueMembers_Leagues_LeagueId",
                table: "LeagueMembers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_LeagueMembers",
                table: "LeagueMembers");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "LeagueMembers",
                newName: "Id");

            migrationBuilder.AlterColumn<string>(
                name: "LeagueId",
                table: "LeagueMembers",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AddPrimaryKey(
                name: "PK_LeagueMembers",
                table: "LeagueMembers",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_LeagueMembers_Leagues_LeagueId",
                table: "LeagueMembers",
                column: "LeagueId",
                principalTable: "Leagues",
                principalColumn: "Id");
        }
    }
}
