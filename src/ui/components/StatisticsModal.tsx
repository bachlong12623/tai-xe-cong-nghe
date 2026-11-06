import React from 'react';
import { DailySummary } from '../../sim/types';
import { BarChart3, TrendingUp, X } from 'lucide-react';

interface StatisticsModalProps {
  currentDay: number;
  historySummaries: DailySummary[];
  onClose: () => void;
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({
  currentDay,
  historySummaries,
  onClose,
}) => {
  // Aggregate stats
  const totalTrips = historySummaries.reduce((sum, d) => sum + d.tripsCount, 0);
  const totalGross = historySummaries.reduce((sum, d) => sum + d.grossRevenue, 0);
  const totalNet = historySummaries.reduce((sum, d) => sum + d.netProfit, 0);
  const totalKm = historySummaries.reduce((sum, d) => sum + d.kmDriven, 0);
  const totalFuel = historySummaries.reduce((sum, d) => sum + d.fuelCost, 0);
  const totalFood = historySummaries.reduce((sum, d) => sum + d.foodCost, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-neutral-100">BÁO CÁO THỐNG KÊ DÀI HẠN (NGÀY {currentDay})</h2>
              <span className="text-[11px] text-neutral-400">Tổng kết doanh thu, chi phí và hiệu suất qua các ngày</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase font-semibold">Doanh thu App</span>
              <div className="font-mono text-sm font-bold text-neutral-200">
                {totalGross.toLocaleString('vi-VN')} đ
              </div>
            </div>

            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase font-semibold">Lợi nhuận thực</span>
              <div className={`font-mono text-sm font-bold ${totalNet >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalNet.toLocaleString('vi-VN')} đ
              </div>
            </div>

            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase font-semibold">Tổng chuyến</span>
              <div className="font-mono text-sm font-bold text-amber-400">
                {totalTrips} cuốc
              </div>
            </div>

            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase font-semibold">Lăn bánh</span>
              <div className="font-mono text-sm font-bold text-blue-400">
                {Math.round(totalKm).toLocaleString()} km
              </div>
            </div>
          </div>

          {/* Daily History Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Lịch sử các ngày gần đây ({historySummaries.length} ngày lưu trữ)
            </h3>

            {historySummaries.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-xs bg-neutral-950 rounded-xl border border-neutral-800">
                Chưa có dữ liệu ngày cũ. Hệ thống sẽ tự lưu báo cáo vào 05:00 sáng mỗi ngày.
              </div>
            ) : (
              <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-900/80 text-[10px] text-neutral-400 uppercase font-mono border-b border-neutral-800">
                    <tr>
                      <th className="p-2.5">Ngày</th>
                      <th className="p-2.5">Cuốc</th>
                      <th className="p-2.5">Doanh thu App</th>
                      <th className="p-2.5">Lợi nhuận thực</th>
                      <th className="p-2.5">Giờ ngủ</th>
                      <th className="p-2.5 text-right">Thu nhập/h</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900 font-mono">
                    {historySummaries.map((d) => (
                      <tr key={d.day} className="hover:bg-neutral-900/40">
                        <td className="p-2.5 font-bold text-neutral-300">Ngày {d.day}</td>
                        <td className="p-2.5 text-neutral-400">{d.tripsCount}</td>
                        <td className="p-2.5 text-neutral-300">{d.grossRevenue.toLocaleString('vi-VN')}đ</td>
                        <td className={`p-2.5 font-bold ${d.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {d.netProfit.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="p-2.5 text-neutral-400">{d.hoursSlept.toFixed(1)}h</td>
                        <td className="p-2.5 text-right text-neutral-300">
                          {d.hourlyNetProfit.toLocaleString('vi-VN')}đ/h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-950/80 border-t border-neutral-800 flex justify-between items-center text-xs text-neutral-400">
          <span>Tổng tiền xăng: {totalFuel.toLocaleString('vi-VN')}đ | Tiền ăn: {totalFood.toLocaleString('vi-VN')}đ</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
