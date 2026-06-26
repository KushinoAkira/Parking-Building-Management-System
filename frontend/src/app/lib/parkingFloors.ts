export type StaffFloorSlot = {
  slotId: string;
  status: string;
  note?: string | null;
  isVip?: boolean;
  activeSession?: {
    sessionId?: number;
    licensePlate: string;
    entryTime: string;
    ticketCode?: string;
  } | null;
};

export type StaffFloorSection = {
  zoneId: number;
  zoneCode: string;
  sectionName: string;
  zoneLetter?: string;
  zoneName: string;
  vehicleType: string;
  isElectric?: boolean;
  capacity: number;
  slots: StaffFloorSlot[];
};

export type StaffFloor = {
  floorId: number;
  floorName: string;
  floorCapacity: number;
  sections: StaffFloorSection[];
};

export function allSlotsForFloor(floor: StaffFloor): StaffFloorSlot[] {
  return floor.sections.flatMap((section) => section.slots);
}

export function findSlotFloor(floors: StaffFloor[], slotId: string): StaffFloor | undefined {
  return floors.find((floor) => allSlotsForFloor(floor).some((slot) => slot.slotId === slotId));
}
