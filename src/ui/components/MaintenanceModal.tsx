import React from 'react';
import { VehicleState, Action } from '../../sim/types';
import { REPAIR_PARTS_INFO } from '../../sim/vehicle';
import { Wrench, X } from 'lucide-react';

interface MaintenanceModalProps {
  isOpen: boolean;
  vehicle: VehicleState;
  cash: number;
  onClose: () => void;
  dispatch: (action: Action) => void;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  vehicle,
  cash,
  onClose,
  dispatch,
}) => {
  if (!isOpen) return null;

  const parts = Object.keys(REPAIR_PARTS_INFO) as Array<keyof VehicleState['condition']>;

  const getPartColor = (val: number) => {
    if (val < 30) return 'text-red-400 bg-red-950/40 border-red-800';
    if (val < 60) return 'text-amber-400 bg-amber-950/40 border-amber-800';
    return 'text-emerald-400 bg-emerald-950/40 border-emerald-800';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-3.5 text-neutral-100">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-sm text-neutral-100">
              TIỆM SỬA XE & BẢO DƯỠNG ({vehicle.name})
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-400">
          Phụ tùng hao mòn làm tăng nguy cơ tai nạn, thủng lốp, chết máy khi ngập và tốn xăng. Bảo dưỡng định kỳ giúp bạn yên tâm cày cuốc!
        </p>

        <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {parts.map((p) => {
            const info = REPAIR_PARTS_INFO[p];
            const cond = Math.round(vehicle.condition[p]);
            const canAfford = cash >= info.price;
            const isFull = cond >= 95;

            return (
              <div
                key={p}
                className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-200">{info.name}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-bold ${getPartColor(cond)}`}>
                      {cond}%
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{info.description}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-amber-400 block mb-1">
                    {info.price.toLocaleString('vi-VN')} đ
                  </span>
                  <button
                    disabled={!canAfford || isFull}
                    onClick={() => dispatch({ t: 'REPAIR_PART', part: p })}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                      isFull
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        : canAfford
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30'
                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    {isFull ? 'Còn rất tốt' : canAfford ? 'Bảo dưỡng' : 'Thiếu tiền'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
