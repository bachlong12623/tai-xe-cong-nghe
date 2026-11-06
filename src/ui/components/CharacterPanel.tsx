import React from 'react';
import { ViewModel } from '../../sim/engine';
import { Action } from '../../sim/types';
import { 
  Heart, 
  Utensils, 
  Zap, 
  Smile, 
  Fuel, 
  Gauge, 
  Coffee, 
  Bed, 
  AlertTriangle,
  Battery,
  Wrench,
  Activity
} from 'lucide-react';

interface CharacterPanelProps {
  view: ViewModel;
  dispatch: (action: Action) => void;
  onOpenEatModal: () => void;
  onOpenDrinkModal: () => void;
  onOpenSleepModal: () => void;
  onOpenMaintenanceModal: () => void;
}

export const CharacterPanel: React.FC<CharacterPanelProps> = ({
  view,
  dispatch,
  onOpenEatModal,
  onOpenDrinkModal,
  onOpenSleepModal,
  onOpenMaintenanceModal,
}) => {
  const getStatColor = (value: number, isCritical: boolean) => {
    if (isCritical || value < 25) return 'bg-red-500 shadow-red-500/50';
    if (value < 50) return 'bg-amber-500 shadow-amber-500/50';
    return 'bg-emerald-500 shadow-emerald-500/50';
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3.5 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div>
          <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            CHỈ SỐ SỨC KHỎE
          </h2>
          <span className="text-[11px] text-neutral-400">Trạng thái cơ thể & Phương tiện</span>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
          {view.activityLabel}
        </span>
      </div>

      {/* Sickness Alert Banner */}
      {view.stats.isSick && (
        <div className="bg-red-950/60 border border-red-800 p-2.5 rounded-lg text-xs text-red-300 flex items-center gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          <span><b>Đang bị ốm sốt!</b> Thể lực tụt nhanh, không thể bật app chạy xe.</span>
        </div>
      )}

      {/* 4 Core Stats + Health & Fatigue */}
      <div className="grid grid-cols-1 gap-2">
        {/* Stamina */}
        <div className="bg-neutral-950/60 p-2 rounded-lg border border-neutral-800/80">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="flex items-center gap-1.5 font-medium text-neutral-300">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              Thể lực
            </span>
            <span className="font-bold font-mono text-neutral-200">
              {view.stats.stamina}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${getStatColor(
                view.stats.stamina,
                view.stats.isStaminaLow
              )}`}
              style={{ width: `${view.stats.stamina}%` }}
            />
          </div>
        </div>

        {/* Hunger */}
        <div className="bg-neutral-950/60 p-2 rounded-lg border border-neutral-800/80">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="flex items-center gap-1.5 font-medium text-neutral-300">
              <Utensils className="w-3.5 h-3.5 text-orange-400" />
              Độ no
            </span>
            <span className="font-bold font-mono text-neutral-200">
              {view.stats.hunger}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${getStatColor(
                view.stats.hunger,
                view.stats.isHungerLow
              )}`}
              style={{ width: `${view.stats.hunger}%` }}
            />
          </div>
        </div>

        {/* Alertness */}
        <div className="bg-neutral-950/60 p-2 rounded-lg border border-neutral-800/80">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="flex items-center gap-1.5 font-medium text-neutral-300">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              Tỉnh táo
            </span>
            <span className="font-bold font-mono text-neutral-200">
              {view.stats.alertness}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${getStatColor(
                view.stats.alertness,
                view.stats.isAlertnessLow
              )}`}
              style={{ width: `${view.stats.alertness}%` }}
            />
          </div>
        </div>

        {/* Morale */}
        <div className="bg-neutral-950/60 p-2 rounded-lg border border-neutral-800/80">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="flex items-center gap-1.5 font-medium text-neutral-300">
              <Smile className="w-3.5 h-3.5 text-sky-400" />
              Tinh thần
            </span>
            <span className="font-bold font-mono text-neutral-200">
              {view.stats.morale}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${getStatColor(
                view.stats.morale,
                view.stats.isMoraleLow
              )}`}
              style={{ width: `${view.stats.morale}%` }}
            />
          </div>
        </div>

        {/* Hidden Stats: Health & Phone Battery */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="bg-neutral-950/80 p-2 rounded-lg border border-neutral-800">
            <span className="flex items-center gap-1 text-[11px] text-neutral-400 mb-0.5">
              <Activity className="w-3 h-3 text-emerald-400" />
              Sức khỏe:
            </span>
            <span className="font-mono font-bold text-neutral-200">
              {view.stats.health}%
            </span>
          </div>

          <div className="bg-neutral-950/80 p-2 rounded-lg border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="flex items-center gap-1 text-[11px] text-neutral-400 mb-0.5">
                <Battery className={`w-3 h-3 ${view.stats.isBatteryLow ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`} />
                Pin:
              </span>
              <span className="font-mono font-bold text-neutral-200">
                {view.stats.phoneBattery}%
              </span>
            </div>
            <button
              onClick={() => dispatch({ t: 'CHARGE_PHONE' })}
              title="Sạc pin tại quán cafe (-15k)"
              className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded hover:bg-cyan-900 transition-colors"
            >
              Sạc
            </button>
          </div>
        </div>
      </div>

      {/* Vehicle Status & Maintenance Button */}
      <div className="bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="font-bold text-neutral-200 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            {view.vehicle.name}
          </span>
          <span className="text-[11px] text-neutral-400 font-mono">
            {view.vehicle.odometerKm.toLocaleString()} km
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
          <span className="flex items-center gap-1">
            <Fuel className="w-3 h-3 text-amber-400" /> Xăng:
          </span>
          <span className="font-mono text-neutral-200">
            {view.vehicle.fuelLiters}L ({view.vehicle.fuelPercent}%)
          </span>
        </div>
        <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              view.vehicle.fuelPercent < 20 ? 'bg-red-500' : 'bg-amber-400'
            }`}
            style={{ width: `${view.vehicle.fuelPercent}%` }}
          />
        </div>

        <button
          onClick={onOpenMaintenanceModal}
          className="w-full flex items-center justify-center gap-1 text-[11px] py-1 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-700/80 rounded transition-colors"
        >
          <Wrench className="w-3 h-3 text-emerald-400" />
          <span>Bảo dưỡng 5 bộ phận xe</span>
        </button>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-auto">
        <button
          onClick={onOpenEatModal}
          className="flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 py-2 px-3 rounded-lg text-xs font-semibold border border-neutral-700 transition-colors"
        >
          <Utensils className="w-3.5 h-3.5 text-orange-400" />
          <span>Ăn uống</span>
        </button>

        <button
          onClick={onOpenDrinkModal}
          className="flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 py-2 px-3 rounded-lg text-xs font-semibold border border-neutral-700 transition-colors"
        >
          <Coffee className="w-3.5 h-3.5 text-yellow-400" />
          <span>Cà phê</span>
        </button>

        <button
          onClick={onOpenSleepModal}
          className="flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 py-2 px-3 rounded-lg text-xs font-semibold border border-neutral-700 transition-colors"
        >
          <Bed className="w-3.5 h-3.5 text-indigo-400" />
          <span>Nghỉ / Ngủ</span>
        </button>

        <button
          onClick={() => dispatch({ t: 'REFUEL' })}
          className="flex items-center justify-center gap-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 py-2 px-3 rounded-lg text-xs font-semibold border border-amber-600/40 transition-colors"
        >
          <Fuel className="w-3.5 h-3.5 text-amber-400" />
          <span>Đổ xăng (~23k)</span>
        </button>
      </div>
    </div>
  );
};
