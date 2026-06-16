import { useState } from "react";
import { Car } from "lucide-react";

// Mock data generation for slots
const generateSlots = (floor: number, count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `F${floor}-${i + 1}`,
    name: `A-${(i + 1).toString().padStart(2, '0')}`,
    isOccupied: Math.random() > 0.6, // 40% occupied roughly
    type: i % 5 === 0 ? "VIP" : "Standard",
  }));
};

const floors = [
  { id: 1, name: "Tầng 1", slots: generateSlots(1, 40) },
  { id: 2, name: "Tầng 2", slots: generateSlots(2, 40) },
  { id: 3, name: "Tầng 3", slots: generateSlots(3, 40) },
];

export function ParkingMap() {
  const [activeFloor, setActiveFloor] = useState(floors[0]);

  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col h-full shadow-sm transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Sơ Đồ Bãi Đỗ</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Quản lý các vị trí đỗ xe theo thời gian thực</p>
        </div>
        
        {/* Floor Tabs */}
        <div className="flex bg-gray-100 dark:bg-[#121212] p-1 rounded-lg border border-gray-200 dark:border-gray-800 w-full sm:w-auto overflow-x-auto">
          {floors.map((floor) => (
            <button
              key={floor.id}
              onClick={() => setActiveFloor(floor)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeFloor.id === floor.id
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-transparent"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800/50"
              }`}
            >
              {floor.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(0,200,83,0.5)]"></div>
          <span className="text-gray-600 dark:text-gray-300">Trống</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
          <span className="text-gray-600 dark:text-gray-300">Đã chiếm</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-3 min-w-[600px] p-1">
          {activeFloor.slots.map((slot) => (
            <div
              key={slot.id}
              className={`
                relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all cursor-pointer group
                ${
                  slot.isOccupied
                    ? "border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:border-red-300 dark:hover:border-red-500/40"
                    : "border-blue-600/20 bg-blue-600/5 dark:bg-blue-600/10 text-blue-600 hover:border-blue-600/40 hover:bg-blue-600/10 dark:hover:bg-blue-600/20"
                }
              `}
            >
              <div className="text-xs font-bold mb-1 opacity-75">{slot.name}</div>
              <Car 
                className={`w-6 h-6 transition-transform duration-300 ${slot.isOccupied ? "opacity-100 scale-100" : "opacity-30 dark:opacity-20 scale-90"}`} 
              />
              
              {/* Tooltip on hover */}
              <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 border border-gray-700 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10 pointer-events-none transition-opacity">
                {slot.isOccupied ? "Biển số: 30A-123.45" : "Có sẵn"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
