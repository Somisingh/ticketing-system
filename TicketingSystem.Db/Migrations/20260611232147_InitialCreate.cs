using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TicketingSystem.Db.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppUsers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FullName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Department = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    IsITTeam = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__AppUsers__3214EC07FA8831BC", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Ticket",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SubmittedByUserId = table.Column<int>(type: "INTEGER", nullable: false),
                    SubmittedByName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    SubmittedByDepartment = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    IssueDescription = table.Column<string>(type: "TEXT", nullable: false),
                    Urgency = table.Column<int>(type: "INTEGER", nullable: false),
                    NotifyOnResolution = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    AssignedToUserId = table.Column<int>(type: "INTEGER", nullable: true),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    ResolutionNotes = table.Column<string>(type: "TEXT", nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    IsDeleted = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Ticket__3214EC07216C54FD", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Ticket_AssignedTo",
                        column: x => x.AssignedToUserId,
                        principalTable: "AppUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Ticket_SubmittedBy",
                        column: x => x.SubmittedByUserId,
                        principalTable: "AppUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.InsertData(
                table: "AppUsers",
                columns: new[] { "Id", "Department", "Email", "FullName", "IsITTeam", "PasswordHash" },
                values: new object[] { 1, null, "testacc@co.nz", "Test User", false, "Admin@123" });

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_Email",
                table: "AppUsers",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Ticket_AssignedToUserId",
                table: "Ticket",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Ticket_Status",
                table: "Ticket",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Ticket_SubmittedByUserId",
                table: "Ticket",
                column: "SubmittedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Ticket");

            migrationBuilder.DropTable(
                name: "AppUsers");
        }
    }
}
