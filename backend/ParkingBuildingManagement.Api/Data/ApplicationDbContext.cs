using Microsoft.EntityFrameworkCore;
using ParkingBuildingManagement.Api.Models;

namespace ParkingBuildingManagement.Api.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<ParkingFacility> ParkingFacilities => Set<ParkingFacility>();
    public DbSet<VehicleType> VehicleTypes => Set<VehicleType>();
    public DbSet<ParkingZone> ParkingZones => Set<ParkingZone>();
    public DbSet<ParkingSlot> ParkingSlots => Set<ParkingSlot>();
    public DbSet<PricingPolicy> PricingPolicies => Set<PricingPolicy>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<ParkingSession> ParkingSessions => Set<ParkingSession>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Incident> Incidents => Set<Incident>();
    public DbSet<Feedback> Feedbacks => Set<Feedback>();
    public DbSet<ReportSnapshot> ReportSnapshots => Set<ReportSnapshot>();
    public DbSet<SystemConfig> SystemConfigs => Set<SystemConfig>();
    public DbSet<WalletTopUp> WalletTopUps => Set<WalletTopUp>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ConfigureAuth(modelBuilder);
        ConfigureFacility(modelBuilder);
        ConfigurePricing(modelBuilder);
        ConfigureOperations(modelBuilder);
        ConfigureFeedbackAndReports(modelBuilder);
        ConfigureSystem(modelBuilder);
        ConfigureWallet(modelBuilder);
        SeedReferenceData(modelBuilder);
    }

    private static void ConfigureAuth(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("Roles");
            entity.HasKey(e => e.RoleId);
            entity.Property(e => e.RoleId).HasColumnName("RoleID");
            entity.Property(e => e.RoleName).HasMaxLength(30).IsRequired();
            entity.HasIndex(e => e.RoleName).IsUnique();
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(e => e.UserId);
            entity.Property(e => e.UserId).HasColumnName("UserID");
            entity.Property(e => e.FullName).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(100).IsRequired();
            entity.Property(e => e.PasswordHash).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.RoleId).HasColumnName("RoleID");
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired().HasDefaultValue("Active");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.WalletBalance).HasColumnType("decimal(12,2)").HasDefaultValue(0m);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasOne(e => e.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureFacility(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ParkingFacility>(entity =>
        {
            entity.ToTable("ParkingFacility");
            entity.HasKey(e => e.FacilityId);
            entity.Property(e => e.FacilityId).HasColumnName("FacilityID");
            entity.Property(e => e.FacilityName).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired().HasDefaultValue("Active");
            entity.Property(e => e.Description).HasMaxLength(500);
        });

        modelBuilder.Entity<VehicleType>(entity =>
        {
            entity.ToTable("VehicleTypes");
            entity.HasKey(e => e.VehicleTypeId);
            entity.Property(e => e.VehicleTypeId).HasColumnName("VehicleTypeID");
            entity.Property(e => e.TypeCode).HasMaxLength(20).IsRequired();
            entity.Property(e => e.TypeName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired().HasDefaultValue("Active");
            entity.HasIndex(e => e.TypeCode).IsUnique();
        });

        modelBuilder.Entity<ParkingZone>(entity =>
        {
            entity.ToTable("ParkingZones");
            entity.HasKey(e => e.ZoneId);
            entity.Property(e => e.ZoneId).HasColumnName("ZoneID");
            entity.Property(e => e.ZoneCode).HasMaxLength(20).IsRequired();
            entity.Property(e => e.ZoneName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.VehicleTypeId).HasColumnName("VehicleTypeID");
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired().HasDefaultValue("Active");
            entity.HasIndex(e => e.ZoneCode).IsUnique();
            entity.HasOne(e => e.VehicleType)
                .WithMany(v => v.ParkingZones)
                .HasForeignKey(e => e.VehicleTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ParkingSlot>(entity =>
        {
            entity.ToTable("ParkingSlots");
            entity.HasKey(e => e.SlotId);
            entity.Property(e => e.SlotId).HasColumnName("SlotID").HasMaxLength(20);
            entity.Property(e => e.ZoneId).HasColumnName("ZoneID");
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired().HasDefaultValue("Available");
            entity.Property(e => e.Note).HasMaxLength(255);
            entity.HasOne(e => e.Zone)
                .WithMany(z => z.ParkingSlots)
                .HasForeignKey(e => e.ZoneId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigurePricing(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PricingPolicy>(entity =>
        {
            entity.ToTable("PricingPolicies");
            entity.HasKey(e => e.PolicyId);
            entity.Property(e => e.PolicyId).HasColumnName("PolicyID");
            entity.Property(e => e.VehicleTypeId).HasColumnName("VehicleTypeID");
            entity.Property(e => e.PolicyName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.PricePerHour).HasColumnType("decimal(12,2)");
            entity.Property(e => e.DailyMaxFee).HasColumnType("decimal(12,2)");
            entity.Property(e => e.LostTicketFee).HasColumnType("decimal(12,2)").HasDefaultValue(0m);
            entity.Property(e => e.OvertimeFee).HasColumnType("decimal(12,2)").HasDefaultValue(0m);
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired().HasDefaultValue("Active");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(e => e.VehicleType)
                .WithMany(v => v.PricingPolicies)
                .HasForeignKey(e => e.VehicleTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Reservation>(entity =>
        {
            entity.ToTable("Reservations");
            entity.HasKey(e => e.ReservationId);
            entity.Property(e => e.ReservationId).HasColumnName("ReservationID");
            entity.Property(e => e.UserId).HasColumnName("UserID");
            entity.Property(e => e.VehicleTypeId).HasColumnName("VehicleTypeID");
            entity.Property(e => e.ZoneId).HasColumnName("ZoneID");
            entity.Property(e => e.SlotId).HasColumnName("SlotID").HasMaxLength(20);
            entity.Property(e => e.LicensePlate).HasMaxLength(20);
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired().HasDefaultValue("Pending");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(e => new { e.UserId, e.Status }).HasDatabaseName("IX_Reservation_User_Status");
            entity.HasIndex(e => new { e.ZoneId, e.ReservedFrom, e.ReservedTo }).HasDatabaseName("IX_Reservation_Zone_TimeRange");
            entity.HasIndex(e => e.LicensePlate).HasDatabaseName("IX_Reservation_LicensePlate");
            entity.HasOne(e => e.User)
                .WithMany(u => u.Reservations)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.VehicleType)
                .WithMany(v => v.Reservations)
                .HasForeignKey(e => e.VehicleTypeId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Zone)
                .WithMany(z => z.Reservations)
                .HasForeignKey(e => e.ZoneId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Slot)
                .WithMany(s => s.Reservations)
                .HasForeignKey(e => e.SlotId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureOperations(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ParkingSession>(entity =>
        {
            entity.ToTable("ParkingSessions");
            entity.HasKey(e => e.SessionId);
            entity.Property(e => e.SessionId).HasColumnName("SessionID");
            entity.Property(e => e.TicketCode).HasMaxLength(50).IsRequired();
            entity.Property(e => e.UserId).HasColumnName("UserID");
            entity.Property(e => e.ReservationId).HasColumnName("ReservationID");
            entity.Property(e => e.VehicleTypeId).HasColumnName("VehicleTypeID");
            entity.Property(e => e.ZoneId).HasColumnName("ZoneID");
            entity.Property(e => e.SlotId).HasColumnName("SlotID").HasMaxLength(20);
            entity.Property(e => e.LicensePlate).HasMaxLength(20).IsRequired();
            entity.Property(e => e.EntryTime).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.EntryGate).HasMaxLength(50);
            entity.Property(e => e.ExitGate).HasMaxLength(50);
            entity.Property(e => e.EstimatedFee).HasColumnType("decimal(12,2)");
            entity.Property(e => e.TotalFee).HasColumnType("decimal(12,2)");
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired().HasDefaultValue("Active");
            entity.Property(e => e.EntryStaffId).HasColumnName("EntryStaffID");
            entity.Property(e => e.ExitStaffId).HasColumnName("ExitStaffID");
            entity.Property(e => e.Note).HasMaxLength(500);
            entity.HasIndex(e => e.LicensePlate).HasDatabaseName("IX_Session_LicensePlate");
            entity.HasIndex(e => e.Status).HasDatabaseName("IX_Session_Status");
            entity.HasIndex(e => e.SlotId).HasDatabaseName("IX_Session_Slot");
            entity.HasIndex(e => e.TicketCode).IsUnique();

            entity.HasOne(e => e.User)
                .WithMany(u => u.DriverSessions)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Reservation)
                .WithMany(r => r.ParkingSessions)
                .HasForeignKey(e => e.ReservationId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.VehicleType)
                .WithMany(v => v.ParkingSessions)
                .HasForeignKey(e => e.VehicleTypeId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Zone)
                .WithMany(z => z.ParkingSessions)
                .HasForeignKey(e => e.ZoneId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Slot)
                .WithMany(s => s.ParkingSessions)
                .HasForeignKey(e => e.SlotId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.EntryStaff)
                .WithMany(u => u.EntryStaffSessions)
                .HasForeignKey(e => e.EntryStaffId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.ExitStaff)
                .WithMany(u => u.ExitStaffSessions)
                .HasForeignKey(e => e.ExitStaffId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.ToTable("Payments");
            entity.HasKey(e => e.PaymentId);
            entity.Property(e => e.PaymentId).HasColumnName("PaymentID");
            entity.Property(e => e.SessionId).HasColumnName("SessionID");
            entity.Property(e => e.Amount).HasColumnType("decimal(12,2)");
            entity.Property(e => e.PaymentMethod).HasMaxLength(30).IsRequired();
            entity.Property(e => e.PaymentTime).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired().HasDefaultValue("Completed");
            entity.HasOne(e => e.Session)
                .WithMany(s => s.Payments)
                .HasForeignKey(e => e.SessionId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Incident>(entity =>
        {
            entity.ToTable("Incidents");
            entity.HasKey(e => e.IncidentId);
            entity.Property(e => e.IncidentId).HasColumnName("IncidentID");
            entity.Property(e => e.SessionId).HasColumnName("SessionID");
            entity.Property(e => e.ReportedById).HasColumnName("ReportedByID");
            entity.Property(e => e.IncidentType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.PenaltyFee).HasColumnType("decimal(12,2)").HasDefaultValue(0m);
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired().HasDefaultValue("Open");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(e => e.Session)
                .WithMany(s => s.Incidents)
                .HasForeignKey(e => e.SessionId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.ReportedBy)
                .WithMany(u => u.ReportedIncidents)
                .HasForeignKey(e => e.ReportedById)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureFeedbackAndReports(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Feedback>(entity =>
        {
            entity.ToTable("Feedbacks");
            entity.HasKey(e => e.FeedbackId);
            entity.Property(e => e.FeedbackId).HasColumnName("FeedbackID");
            entity.Property(e => e.UserId).HasColumnName("UserID");
            entity.Property(e => e.SessionId).HasColumnName("SessionID");
            entity.Property(e => e.FeedbackType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Content).HasMaxLength(1000);
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired().HasDefaultValue("New");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(e => e.User)
                .WithMany(u => u.Feedbacks)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Session)
                .WithMany(s => s.Feedbacks)
                .HasForeignKey(e => e.SessionId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ReportSnapshot>(entity =>
        {
            entity.ToTable("ReportSnapshots");
            entity.HasKey(e => e.ReportId);
            entity.Property(e => e.ReportId).HasColumnName("ReportID");
            entity.Property(e => e.VehicleTypeId).HasColumnName("VehicleTypeID");
            entity.Property(e => e.TotalRevenue).HasColumnType("decimal(14,2)").HasDefaultValue(0m);
            entity.Property(e => e.OccupancyRate).HasColumnType("decimal(5,2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(e => new { e.ReportDate, e.VehicleTypeId }).IsUnique();
            entity.HasOne(e => e.VehicleType)
                .WithMany(v => v.ReportSnapshots)
                .HasForeignKey(e => e.VehicleTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureSystem(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SystemConfig>(entity =>
        {
            entity.ToTable("SystemConfigs");
            entity.HasKey(e => e.ConfigKey);
            entity.Property(e => e.ConfigKey).HasMaxLength(100);
            entity.Property(e => e.ConfigValue).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
        });
    }

    private static void ConfigureWallet(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<WalletTopUp>(entity =>
        {
            entity.ToTable("WalletTopUps");
            entity.HasKey(e => e.TopUpId);
            entity.Property(e => e.TopUpId).HasColumnName("TopUpID");
            entity.Property(e => e.UserId).HasColumnName("UserID");
            entity.Property(e => e.Amount).HasColumnType("decimal(12,2)").IsRequired();
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired().HasDefaultValue("Pending");
            entity.Property(e => e.PayOsOrderCode).IsRequired();
            entity.Property(e => e.CheckoutUrl).HasMaxLength(500);
            entity.Property(e => e.QrCode).HasMaxLength(2000);
            entity.Property(e => e.PaymentLinkId).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(e => e.PayOsOrderCode).IsUnique();
            entity.HasIndex(e => new { e.UserId, e.Status }).HasDatabaseName("IX_WalletTopUp_User_Status");
            entity.HasIndex(e => e.CreatedAt).HasDatabaseName("IX_WalletTopUp_CreatedAt");
            entity.HasOne(e => e.User)
                .WithMany(u => u.WalletTopUps)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void SeedReferenceData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Role>().HasData(
            new Role { RoleId = 1, RoleName = "Admin" },
            new Role { RoleId = 2, RoleName = "Manager" },
            new Role { RoleId = 3, RoleName = "Staff" },
            new Role { RoleId = 4, RoleName = "Driver" });

        modelBuilder.Entity<VehicleType>().HasData(
            new VehicleType { VehicleTypeId = 1, TypeCode = "MOTORBIKE", TypeName = "Motorbike", Status = "Active" },
            new VehicleType { VehicleTypeId = 2, TypeCode = "CAR", TypeName = "Car", Status = "Active" },
            new VehicleType { VehicleTypeId = 3, TypeCode = "EV", TypeName = "Electric Vehicle", Status = "Active" },
            new VehicleType { VehicleTypeId = 4, TypeCode = "EV_MOTORBIKE", TypeName = "Electric Motorbike", Status = "Active" },
            new VehicleType { VehicleTypeId = 5, TypeCode = "EV_CAR", TypeName = "Electric Car", Status = "Active" });
    }
}
