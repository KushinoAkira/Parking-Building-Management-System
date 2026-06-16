import { Banknote, Check, Plus, Edit2, ShieldAlert, Bike, Car, Star } from "lucide-react";

const pricingPlans = [
  {
    icon: <Bike className="w-6 h-6" />,
    title: "Xe Máy",
    subtitle: "Áp dụng cho mọi loại xe máy 2 bánh.",
    color: "blue",
    featured: false,
    items: [
      { label: "Theo lượt (Ngày)", value: "5,000 đ" },
      { label: "Theo lượt (Đêm)", value: "10,000 đ" },
      { label: "Vé tháng", value: "120,000 đ", accent: true },
    ],
  },
  {
    icon: <Car className="w-6 h-6" />,
    title: "Ô Tô Tiêu Chuẩn",
    subtitle: "Slot thông thường, dưới 9 chỗ ngồi.",
    color: "green",
    featured: true,
    items: [
      { label: "Block đầu (2h)", value: "30,000 đ" },
      { label: "Mỗi giờ tiếp theo", value: "+10,000 đ" },
      { label: "Vé tháng", value: "1,500,000 đ", accent: true },
    ],
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: "Ô Tô VIP",
    subtitle: "Slot kích thước lớn, gần thang máy.",
    color: "yellow",
    featured: false,
    items: [
      { label: "Block đầu (2h)", value: "50,000 đ" },
      { label: "Mỗi giờ tiếp theo", value: "+20,000 đ" },
      { label: "Vé tháng", value: "2,500,000 đ", accent: true },
    ],
  },
];

const colorMap: Record<string, { badge: string; icon: string; border: string; featuredBorder: string; accent: string }> = {
  blue: {
    badge: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
    icon: "bg-blue-50 dark:bg-blue-500/15 text-blue-500",
    border: "border-gray-200 dark:border-gray-800",
    featuredBorder: "border-blue-300 dark:border-blue-500/30",
    accent: "text-blue-600 dark:text-blue-400",
  },
  green: {
    badge: "bg-blue-600/10 text-blue-600",
    icon: "bg-blue-600/10 text-blue-600",
    border: "border-blue-600/30",
    featuredBorder: "border-blue-600/50",
    accent: "text-blue-600",
  },
  yellow: {
    badge: "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    icon: "bg-yellow-50 dark:bg-yellow-500/15 text-yellow-500",
    border: "border-gray-200 dark:border-gray-800",
    featuredBorder: "border-yellow-300 dark:border-yellow-500/30",
    accent: "text-yellow-600 dark:text-yellow-500",
  },
};

export function PricingPolicies() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bảng Giá & Chính Sách</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Cấu hình giá vé và các quy định cho bãi đỗ xe</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600/90 transition-colors shadow-md shadow-blue-600/20">
          <Plus className="w-4 h-4" />
          Thêm Bảng Giá
        </button>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pricingPlans.map((plan) => {
          const colors = colorMap[plan.color];
          return (
            <div
              key={plan.title}
              className={`relative bg-white dark:bg-[#1A1A1A] rounded-2xl border-2 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow ${
                plan.featured ? colors.featuredBorder : `border-gray-200 dark:border-gray-800`
              }`}
            >
              {plan.featured && (
                <div className={`absolute top-0 inset-x-0 flex justify-center`}>
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-b-xl text-xs font-bold tracking-wide">
                    PHỔ BIẾN NHẤT
                  </span>
                </div>
              )}

              <div className={`p-6 ${plan.featured ? 'pt-9' : ''} border-b border-gray-100 dark:border-gray-800`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${colors.icon}`}>
                    {plan.icon}
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${plan.featured ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>{plan.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{plan.subtitle}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col gap-0">
                {plan.items.map((item, i) => (
                  <div
                    key={item.label}
                    className={`flex justify-between items-center py-3.5 ${i < plan.items.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                  >
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{item.label}</span>
                    <span className={`font-bold text-base ${item.accent ? colors.accent : 'text-gray-900 dark:text-white'}`}>{item.value}</span>
                  </div>
                ))}

                <button className={`mt-5 w-full flex justify-center items-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                  plan.featured
                    ? 'border-blue-600/30 bg-blue-600/10 text-blue-600 hover:bg-blue-600/20'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}>
                  <Edit2 className="w-4 h-4" /> Chỉnh sửa
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Policies Section */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#121212]/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/10 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Quy Định Chung</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">3 quy định đang áp dụng</p>
            </div>
          </div>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-600/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-600/10">
            Chỉnh sửa
          </button>
        </div>
        <div className="p-6">
          <ul className="space-y-5">
            {[
              {
                title: "Thời gian quy định Ngày/Đêm",
                desc: "Ban ngày tính từ 06:00 đến 18:00. Ban đêm tính từ 18:00 đến 06:00 sáng hôm sau.",
              },
              {
                title: "Mất thẻ xe",
                desc: "Phạt 50,000đ/thẻ đối với xe máy và 100,000đ/thẻ đối với ô tô, cộng thêm phí đỗ xe phát sinh.",
              },
              {
                title: "Thời gian ân hạn (Grace period)",
                desc: "Miễn phí 15 phút đầu tiên sau khi quẹt thẻ vào đối với mọi phương tiện.",
              },
            ].map((rule) => (
              <li key={rule.title} className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-blue-600/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white block mb-1 text-sm">{rule.title}</strong>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{rule.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
