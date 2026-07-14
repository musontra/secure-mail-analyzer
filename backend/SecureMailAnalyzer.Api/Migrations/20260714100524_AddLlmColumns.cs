using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SecureMailAnalyzer.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddLlmColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "educational_explanation",
                table: "analyses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "llm_assessment",
                table: "analyses",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "educational_explanation",
                table: "analyses");

            migrationBuilder.DropColumn(
                name: "llm_assessment",
                table: "analyses");
        }
    }
}
