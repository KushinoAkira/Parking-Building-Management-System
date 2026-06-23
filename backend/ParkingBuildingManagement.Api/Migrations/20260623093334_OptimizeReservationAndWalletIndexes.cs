using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ParkingBuildingManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class OptimizeReservationAndWalletIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WalletTopUps_UserID",
                table: "WalletTopUps");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_UserID",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_ZoneID",
                table: "Reservations");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTopUp_CreatedAt",
                table: "WalletTopUps",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTopUp_User_Status",
                table: "WalletTopUps",
                columns: new[] { "UserID", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Reservation_LicensePlate",
                table: "Reservations",
                column: "LicensePlate");

            migrationBuilder.CreateIndex(
                name: "IX_Reservation_User_Status",
                table: "Reservations",
                columns: new[] { "UserID", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Reservation_Zone_TimeRange",
                table: "Reservations",
                columns: new[] { "ZoneID", "ReservedFrom", "ReservedTo" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WalletTopUp_CreatedAt",
                table: "WalletTopUps");

            migrationBuilder.DropIndex(
                name: "IX_WalletTopUp_User_Status",
                table: "WalletTopUps");

            migrationBuilder.DropIndex(
                name: "IX_Reservation_LicensePlate",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservation_User_Status",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservation_Zone_TimeRange",
                table: "Reservations");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTopUps_UserID",
                table: "WalletTopUps",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_UserID",
                table: "Reservations",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_ZoneID",
                table: "Reservations",
                column: "ZoneID");
        }
    }
}
