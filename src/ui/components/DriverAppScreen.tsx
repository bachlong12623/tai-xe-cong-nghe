import React from 'react';
import { ViewModel } from '../../sim/engine';
import { Action, GameState } from '../../sim/types';
import { 
  Smartphone, 
  Star, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Radio, 
  Power 
} from 'lucide-react';

interface DriverAppScreenProps {
  state: GameState;
  view: ViewModel;
  dispatch?: (action: Action) => void;
}

export const DriverAppScreen: React.FC<DriverAppScreenProps> = ({ state, view }) => {
  const tierName = state.app.tier.toUpperCase();
  const getTierColor = () => {
    switch (state.app.tier) {
      case 'bronze': return 'text-amber-600 bg-amber-950/40 border-amber-800';
      case 'silver': return 'text-slate-300 bg-slate-800/60 border-slate-600';
      case 'gold': return 'text-yellow-400 bg-yellow-950/50 border-yellow-600';
      case 'diamond': return 'text-cyan-400 bg-cyan-950/50 border-cyan-500';
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3.5 shadow-lg h-full">
      {/* Smartphone Mockup Frame Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-neutral-100">APP TÀI XẾ CÔNG NGHỆ</h2>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] text-neutral-400 font-mono">v4.0 (Giả lập)</span>
        </div>
      </div>

      {/* Driver Profile Card */}
      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-sm text-neutral-950 shadow-md">
            TX
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
              Tài Xế Công Nghệ
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${getTierColor()}`}>
                {tierName}
              </span>
            </h3>
            <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-0.5">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3 h-3 fill-current" />
                {state.app.rating.toFixed(2)}
              </span>
              <span>
                Nhận cuốc: <b className="text-neutral-200">{(state.app.acceptanceRate * 100).toFixed(0)}%</b>
              </span>
              <span>
                Hủy: <b className="text-neutral-200">{(state.app.cancellationRate * 100).toFixed(0)}%</b>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Radar Search Area or Offline Banner */}
      <div className="flex-1 min-h-[160px] bg-neutral-950 rounded-xl border border-neutral-800/90 p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
        {view.isOnline ? (
          <>
            {/* Animated Radar Circles */}
            <div className="relative flex items-center justify-center mb-3">
              <div className="w-20 h-20 rounded-full border border-emerald-500/20 animate-ping absolute" />
              <div className="w-14 h-14 rounded-full border border-emerald-500/40 animate-pulse absolute" />
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Radio className="w-5 h-5 text-emerald-400 animate-spin" />
              </div>
            </div>

            <p className="text-xs font-semibold text-emerald-300">
              Đang trực tuyến tại {view.location.zoneName}
            </p>
            <p className="text-[11px] text-neutral-400 max-w-[220px] mt-1">
              Đang tìm kiếm đơn giao đồ ăn và cuốc chở khách phù hợp quanh bạn...
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-2 text-neutral-500">
              <Power className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-neutral-300">
              Ứng dụng đang Ngoại Tuyến
            </p>
            <p className="text-[11px] text-neutral-500 max-w-[220px] mt-0.5">
              Bật ứng dụng lên khi bạn đã sẵn sàng nhận cuốc chạy ngoài đường.
            </p>
          </>
        )}
      </div>

      {/* Daily Performance Stats */}
      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-200">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            Thu nhập trong ngày
          </span>
          <span className="text-[10px] text-neutral-400 font-normal">Hôm nay</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block">Doanh thu trên App:</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">
              {state.economy.todayRevenue.toLocaleString('vi-VN')} đ
            </span>
          </div>

          <div className="bg-neutral-900/80 p-2 rounded border border-neutral-800">
            <span className="text-[10px] text-neutral-400 block">Chi phí xăng/ăn:</span>
            <span className="font-bold text-rose-400 font-mono text-sm">
              -{(state.economy.todayExpenses.fuel + state.economy.todayExpenses.food).toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-400 border-t border-neutral-800/80 pt-1.5 mt-1">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Cuốc hoàn thành: <b className="text-neutral-200">{state.economy.todayTrips}</b>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            Online: <b className="text-neutral-200">{(state.economy.minutesOnlineToday / 60).toFixed(1)}h</b>
          </span>
        </div>
      </div>
    </div>
  );
};
