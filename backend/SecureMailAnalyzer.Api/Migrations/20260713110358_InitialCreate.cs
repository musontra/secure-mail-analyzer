using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SecureMailAnalyzer.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "analyses",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    input_type = table.Column<string>(type: "text", nullable: false),
                    input_content = table.Column<string>(type: "text", nullable: false),
                    risk_level = table.Column<string>(type: "text", nullable: false),
                    risk_score = table.Column<int>(type: "integer", nullable: false),
                    detected_signals = table.Column<string>(type: "jsonb", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_analyses", x => x.id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "analyses");
        }
    }
}
