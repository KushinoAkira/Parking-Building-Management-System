using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParkingBuildingManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddActivePlateUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Session_LicensePlate",
                table: "ParkingSessions");

            migrationBuilder.CreateIndex(
                name: "IX_Session_LicensePlate",
                table: "ParkingSessions",
                column: "LicensePlate",
                unique: true,
                filter: "\"Status\" = 'Active'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Session_LicensePlate",
                table: "ParkingSessions");

            migrationBuilder.CreateIndex(
                name: "IX_Session_LicensePlate",
                table: "ParkingSessions",
                column: "LicensePlate");
        }
    }
}
