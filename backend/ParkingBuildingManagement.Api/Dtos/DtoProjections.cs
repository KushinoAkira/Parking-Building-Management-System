using System.Linq.Expressions;
using ParkingBuildingManagement.Api.Models;

namespace ParkingBuildingManagement.Api.Dtos;

public static class DtoProjections
{
    public static readonly Expression<Func<ParkingSession, SessionDto>> Session =
        s => new SessionDto(
            s.SessionId,
            s.TicketCode,
            s.UserId,
            s.ReservationId,
            s.VehicleTypeId,
            s.VehicleType.TypeCode,
            s.ZoneId,
            s.Zone.ZoneCode,
            s.SlotId,
            s.LicensePlate,
            s.EntryTime,
            s.ExitTime,
            s.EntryGate,
            s.ExitGate,
            s.EstimatedFee,
            s.TotalFee,
            s.Status,
            s.EntryStaffId,
            s.ExitStaffId,
            s.Note);

    public static readonly Expression<Func<Reservation, ReservationDto>> Reservation =
        r => new ReservationDto(
            r.ReservationId,
            r.UserId,
            r.User.FullName,
            r.VehicleTypeId,
            r.VehicleType.TypeCode,
            r.ZoneId,
            r.Zone != null ? r.Zone.ZoneCode : null,
            r.SlotId,
            r.LicensePlate,
            r.ReservedFrom,
            r.ReservedTo,
            r.Status,
            r.PreferVipSlot,
            r.VipSurcharge,
            r.Slot != null && r.Slot.Note == "VIP",
            r.CreatedAt);

    public static readonly Expression<Func<SubscriptionPlan, SubscriptionPlanDto>> SubscriptionPlan =
        p => new SubscriptionPlanDto(
            p.PlanId,
            p.PlanName,
            p.VehicleTypeId,
            p.VehicleType.TypeCode,
            p.ZoneId,
            p.Zone != null ? p.Zone.ZoneCode : null,
            p.DurationDays,
            p.Price,
            p.Status,
            p.CreatedAt);

    public static readonly Expression<Func<Subscription, SubscriptionDto>> Subscription =
        s => new SubscriptionDto(
            s.SubscriptionId,
            s.UserId,
            s.PlanId,
            s.Plan.PlanName,
            s.VehicleTypeId,
            s.VehicleType.TypeCode,
            s.ZoneId,
            s.Zone != null ? s.Zone.ZoneCode : null,
            s.LicensePlate,
            s.StartDate,
            s.EndDate,
            s.PricePaid,
            s.Status,
            s.Status == "Active" && s.EndDate > DateTime.UtcNow,
            s.CreatedAt);
}
