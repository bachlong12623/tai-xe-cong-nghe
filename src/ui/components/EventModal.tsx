import React from 'react';
import { GameEvent, AccidentEvent, Action } from '../../sim/types';
import { AlertTriangle, Zap } from 'lucide-react';

interface EventModalProps {
  activeEvent: GameEvent | null;
  activeAccident: AccidentEvent | null;
  dispatch: (action: Action) => void;
}

export const EventModal: React.FC<EventModalProps> = ({ activeEvent, activeAccident, dispatch }) => {
  if (!activeEvent && !activeAccident) return null;

  if (activeAccident) {
    const isSevere = activeAccident.severity === 'severe';
    const isMod = activeAccident.severity === 'moderate';

    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-neutral-900 border border-red-700/80 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-3 text-neutral-100">
          <div className="flex items-center gap-2 text-rose-400 border-b border-neutral-800 pb-2.5">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
            <span className="font-mono text-xs uppercase tracking-wider font-extrabold">
              TAI NẠN GIAO THÔNG ({activeAccident.severity.toUpperCase()})
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-neutral-100">{activeAccident.title}</h3>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{activeAccident.description}</p>
          </div>

          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Tiền sửa chữa xe:</span>
              <span className="font-mono font-bold text-rose-400">-{activeAccident.repairCost.toLocaleString('vi-VN')} đ</span>
            </div>
            {activeAccident.medicalCost > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Chi phí thuốc men/y tế:</span>
                <span className="font-mono font-bold text-rose-400">-{activeAccident.medicalCost.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Tổn hại sức khỏe:</span>
              <span className="font-mono font-bold text-amber-400">-{activeAccident.healthPenalty} Sức khỏe</span>
            </div>
          </div>

          <button
            onClick={() => dispatch({ t: 'DISMISS_ACCIDENT' })}
            className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition-all ${
              isSevere
                ? 'bg-red-700 hover:bg-red-600 shadow-red-900/40'
                : isMod
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40'
                : 'bg-neutral-700 hover:bg-neutral-600'
            }`}
          >
            Đã xử lý xong hiện trường, tiếp tục
          </button>
        </div>
      </div>
    );
  }

  if (activeEvent) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-3.5 text-neutral-100">
          <div className="flex items-center gap-2 text-amber-400 border-b border-neutral-800 pb-2.5">
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="font-mono text-xs uppercase tracking-wider font-extrabold">
              SỰ KIỆN ĐƯỜNG PHỐ
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-neutral-100">{activeEvent.name}</h3>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{activeEvent.description}</p>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">
              Lựa chọn hành động của bạn:
            </span>

            {activeEvent.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => dispatch({ t: 'CHOOSE_EVENT_OPTION', eventId: activeEvent.id, optionIndex: idx })}
                className="bg-neutral-950 hover:bg-neutral-800/80 p-3 rounded-xl border border-neutral-800 hover:border-emerald-500/60 text-left transition-all flex flex-col gap-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200 group-hover:text-emerald-300">
                    {opt.label}
                  </span>
                  {opt.cost > 0 && (
                    <span className="text-xs font-mono font-bold text-rose-400">
                      -{opt.cost.toLocaleString('vi-VN')} đ
                    </span>
                  )}
                  {opt.cost < 0 && (
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      +{Math.abs(opt.cost).toLocaleString('vi-VN')} đ
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
