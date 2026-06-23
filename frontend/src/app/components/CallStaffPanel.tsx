import { useMemo, useState } from "react";
import { Phone, PhoneCall, PhoneOff, X, Circle, User } from "lucide-react";
import { useLocale } from "../lib/i18n/LocaleContext";

export function CallStaffPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useLocale();
  const [callingContact, setCallingContact] = useState<any | null>(null);

  const staffList = useMemo(() => [
    { id: '1', name: t("callStaff.station1"), status: 'online', avatar: 'https://images.unsplash.com/photo-1544168190-79c17527004f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMG1hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc3OTk3NjA0N3ww&ixlib=rb-4.1.0&q=80&w=1080' },
    { id: '2', name: t("callStaff.station2"), status: 'online', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMHdvbWFuJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzc5OTYyNjEwfDA&ixlib=rb-4.1.0&q=80&w=1080' },
    { id: '3', name: t("callStaff.station3"), status: 'offline', avatar: 'https://images.unsplash.com/photo-1758600431229-191932ccee81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMG1hdHVyZSUyMG1hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc4MDA1Nzg5Mnww&ixlib=rb-4.1.0&q=80&w=1080' },
    { id: 'all', name: t("callStaff.allStaff"), status: 'online', avatar: null, isGroup: true },
  ], [t]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1A1A1A] w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800">
        {callingContact ? (
          <div className="flex flex-col items-center py-8 text-center animate-in zoom-in-95 duration-200">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-20" />
              <div className="w-24 h-24 bg-green-50 dark:bg-blue-600/20 rounded-full flex items-center justify-center relative z-10 border-4 border-white dark:border-[#1A1A1A]">
                {callingContact.avatar ? (
                  <img src={callingContact.avatar} alt={callingContact.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <PhoneCall className="w-10 h-10 text-blue-600" />
                )}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t("callStaff.calling")}</h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-10">{callingContact.name}</p>
            <button 
              onClick={() => setCallingContact(null)}
              className="bg-red-500 hover:bg-red-600 text-white p-5 rounded-full shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95 group"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">{t("callStaff.title")}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("callStaff.subtitle")}</p>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {staffList.map((staff) => (
                <div 
                  key={staff.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#121212] border border-gray-100 dark:border-gray-800 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {staff.avatar ? (
                        <img src={staff.avatar} alt={staff.name} className="w-10 h-10 rounded-full object-cover bg-white dark:bg-gray-800" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                      {staff.status === 'online' ? (
                        <Circle className="w-3 h-3 text-blue-600 fill-blue-600 absolute bottom-0 right-0 ring-2 ring-white dark:ring-[#121212] rounded-full" />
                      ) : (
                        <Circle className="w-3 h-3 text-gray-400 fill-gray-400 absolute bottom-0 right-0 ring-2 ring-white dark:ring-[#121212] rounded-full" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">{staff.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {staff.status === 'online' ? t("callStaff.onDuty") : t("common.offline")}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setCallingContact(staff)}
                    disabled={staff.status === 'offline'}
                    className="p-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-green-50 text-blue-600 hover:bg-blue-600 hover:text-white dark:bg-blue-600/10 dark:hover:bg-blue-600 dark:hover:text-white shadow-sm"
                    title={t("callStaff.callNow")}
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
