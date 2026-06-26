using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParkingBuildingManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddReservationVipFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "PreferVipSlot",
                table: "Reservations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "VipSurcharge",
                table: "Reservations",
                type: "numeric(12,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PreferVipSlot",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "VipSurcharge",
                table: "Reservations");
        }
    }
}
