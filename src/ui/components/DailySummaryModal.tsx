import React from 'react';
import { DailySummary } from '../../sim/types';
import { 
  DollarSign, 
  Fuel, 
  Utensils, 
  Wrench, 
  TrendingUp, 
  CheckCircle,
  HelpCircle,
  Home
} from 'lucide-react';

interface DailySummaryModalProps {
  isOpen: boolean;
  summary: DailySummary | null;
  onClose: () => void;
}

export const DailySummaryModal: React.FC<DailySummaryModalProps> = ({ isOpen, summary, onClose }) => {
  if (!isOpen || !summary) return null;

  const isProfitable = summary.netProfit > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4 text-neutral-100">
        {/* Header Banner */}
        <div className="text-center border-b border-neutral-800 pb-3">
          <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
            BẢNG KÊ THU NHẬP NGÀY {summary.day}
          </span>
          <h2 className="text-lg font-black mt-1.5 text-neutral-100">
            TỔNG KẾT 24 GIỜ MƯU SINH
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Sự thật đằng sau những cuốc xe: Doanh thu app vs Lợi nhuận thực vào túi
          </p>
        </div>

        {/* Big Contrast Comparison Card */}
        <div className="grid grid-cols-2 gap-3 bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
          {/* App Revenue */}
          <div className="flex flex-col justify-between p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800">
            <span className="text-[11px] text-neutral-400">Doanh thu trên App:</span>
            <span className="text-lg font-black text-cyan-400 font-mono mt-1">
              {summary.grossRevenue.toLocaleString('vi-VN')} đ
            </span>
            <span className="text-[10px] text-neutral-500 mt-1">
              Số tiền hiển thị tài xế nhìn thấy
            </span>
          </div>

          {/* Real Net Profit */}
          <div className={`flex flex-col justify-between p-2.5 rounded-lg border ${
            isProfitable 
              ? 'bg-emerald-950/30 border-emerald-600/40 text-emerald-300' 
              : 'bg-rose-950/30 border-rose-600/40 text-rose-300'
          }`}>
            <span className="text-[11px] font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              LỢI NHUẬN THỰC TẾ:
            </span>
            <span className="text-xl font-black font-mono mt-1">
              {summary.netProfit.toLocaleString('vi-VN')} đ
            </span>
            <span className="text-[10px] font-mono opacity-80 mt-1">
              {summary.hourlyNetProfit.toLocaleString('vi-VN')} đ / giờ online
            </span>
          </div>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex flex-col gap-2 text-xs">
          <h4 className="text-[11px] font-bold text-neutral-300 uppercase tracking-wide border-b border-neutral-800/80 pb-1 flex items-center justify-between">
            <span>Chi tiết các khoản khấu trừ:</span>
            <HelpCircle className="w-3 h-3 text-neutral-500" />
          </h4>

          <div className="flex justify-between items-center text-neutral-300">
            <span className="flex items-center gap-1.5 text-neutral-400">
              <DollarSign className="w-3.5 h-3.5 text-neutral-500" />
              Chiết khấu nền tảng (App fee ~25%):
            </span>
            <span className="font-mono text-rose-400">
              -{summary.platformCommission.toLocaleString('vi-VN')} đ
            </span>
          </div>

          <div className="flex justify-between items-center text-neutral-300">
            <span className="flex items-center gap-1.5 text-neutral-400">
              <Fuel className="w-3.5 h-3.5 text-amber-500" />
              Tiền xăng xe thực tế:
            </span>
            <span className="font-mono text-rose-400">
              -{summary.fuelCost.toLocaleString('vi-VN')} đ
            </span>
          </div>

          <div className="flex justify-between items-center text-neutral-300">
            <span className="flex items-center gap-1.5 text-neutral-400">
              <Utensils className="w-3.5 h-3.5 text-orange-400" />
              Tiền ăn uống, cà phê nạp sức:
            </span>
            <span className="font-mono text-rose-400">
              -{summary.foodCost.toLocaleString('vi-VN')} đ
            </span>
          </div>

          <div className="flex justify-between items-center text-neutral-300">
            <span className="flex items-center gap-1.5 text-neutral-400">
              <Wrench className="w-3.5 h-3.5 text-slate-400" />
              Hao mòn vỏ lốp, nhớt & khấu hao xe:
            </span>
            <span className="font-mono text-rose-400">
              -{summary.vehicleWearEstimate.toLocaleString('vi-VN')} đ
            </span>
          </div>

          {summary.rentCost > 0 && (
            <div className="flex justify-between items-center text-neutral-300">
              <span className="flex items-center gap-1.5 text-neutral-400">
                <Home className="w-3.5 h-3.5 text-blue-400" />
                Tiền phòng trọ cố định:
              </span>
              <span className="font-mono text-rose-400">
                -{summary.rentCost.toLocaleString('vi-VN')} đ
              </span>
            </div>
          )}
        </div>

        {/* Operating Stats Footnote */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/70 text-neutral-400">
          <div>
            <span className="text-[10px] block">Cuốc hoàn thành</span>
            <b className="text-neutral-100 font-mono text-sm">{summary.tripsCount}</b>
          </div>
          <div>
            <span className="text-[10px] block">Lăn bánh</span>
            <b className="text-neutral-100 font-mono text-sm">{summary.kmDriven.toFixed(1)} km</b>
          </div>
          <div>
            <span className="text-[10px] block">Giờ ngủ</span>
            <b className="text-neutral-100 font-mono text-sm">{summary.hoursSlept.toFixed(1)} h</b>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onClose}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-2 transition-all mt-1"
        >
          <CheckCircle className="w-4 h-4" />
          <span>BẮT ĐẦU NGÀY MỚI</span>
        </button>
      </div>
    </div>
  );
};
