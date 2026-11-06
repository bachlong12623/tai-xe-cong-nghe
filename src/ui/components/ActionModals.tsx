import React from 'react';
import { Action } from '../../sim/types';
import itemsData from '../../../data/items.json';
import { X, Utensils, Coffee, Bed, Clock } from 'lucide-react';

interface EatModalProps {
  isOpen: boolean;
  onClose: () => void;
  cash: number;
  dispatch: (action: Action) => void;
}

export const EatModal: React.FC<EatModalProps> = ({ isOpen, onClose, cash, dispatch }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-md w-full p-4 shadow-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-orange-400" />
            <h3 className="font-bold text-sm text-neutral-100">Chọn bữa ăn</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {itemsData.foods.map((food) => {
            const canAfford = cash >= food.price;
            return (
              <div
                key={food.id}
                className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex items-center justify-between gap-3 hover:border-neutral-700 transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-neutral-200">{food.name}</h4>
                  <p className="text-[11px] text-neutral-400">{food.description}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-emerald-400">
                    <span>No +{food.hungerRestore}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-neutral-400">
                      <Clock className="w-2.5 h-2.5" /> {food.durationMinutes} phút
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold font-mono text-amber-400 mb-1">
                    {food.price.toLocaleString('vi-VN')} đ
                  </div>
                  <button
                    disabled={!canAfford}
                    onClick={() => {
                      dispatch({ t: 'EAT', itemId: food.id });
                      onClose();
                    }}
                    className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors ${
                      canAfford
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? 'Ăn món này' : 'Thiếu tiền'}
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

interface DrinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  cash: number;
  dispatch: (action: Action) => void;
}

export const DrinkModal: React.FC<DrinkModalProps> = ({ isOpen, onClose, cash, dispatch }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-md w-full p-4 shadow-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-yellow-400" />
            <h3 className="font-bold text-sm text-neutral-100">Chọn đồ uống / Cà phê</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {itemsData.drinks.map((drink) => {
            const canAfford = cash >= drink.price;
            return (
              <div
                key={drink.id}
                className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex items-center justify-between gap-3 hover:border-neutral-700 transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-neutral-200">{drink.name}</h4>
                  <p className="text-[11px] text-neutral-400">{drink.description}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-yellow-400">
                    {drink.alertnessRestore ? (
                      <span>Tỉnh táo +{drink.alertnessRestore} (tức thì)</span>
                    ) : (
                      <span className="text-cyan-400">Giải khát</span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold font-mono text-amber-400 mb-1">
                    {drink.price.toLocaleString('vi-VN')} đ
                  </div>
                  <button
                    disabled={!canAfford}
                    onClick={() => {
                      dispatch({ t: 'DRINK', itemId: drink.id });
                      onClose();
                    }}
                    className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors ${
                      canAfford
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? 'Uống ly này' : 'Thiếu tiền'}
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

interface SleepModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatch: (action: Action) => void;
}

export const SleepModal: React.FC<SleepModalProps> = ({ isOpen, onClose, dispatch }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-sm w-full p-4 shadow-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <div className="flex items-center gap-2">
            <Bed className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm text-neutral-100">Nghỉ ngơi & Giấc ngủ</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2.5 text-xs">
          {/* Power Nap Option */}
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-neutral-200">Chợp mắt 20 phút bên lề đường</span>
              <span className="text-emerald-400 font-mono text-[11px]">+15 Tỉnh táo</span>
            </div>
            <p className="text-[11px] text-neutral-400 mb-2">
              Giải pháp cứu cánh nhanh khi quá buồn ngủ giữa cuốc (hiệu quả 1 lần / 4 tiếng).
            </p>
            <button
              onClick={() => {
                dispatch({ t: 'NAP' });
                onClose();
              }}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 py-1.5 rounded font-semibold text-xs transition-colors border border-neutral-700"
            >
              Chợp mắt ngay (20 phút)
            </button>
          </div>

          {/* Full Sleep Options */}
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-neutral-200 font-bold">
              <span>Về phòng trọ ngủ</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Nhu cầu cơ thể: 7 tiếng/ngày. Thiếu ngủ sẽ tích lũy nợ ngủ khiến cơ thể nhanh mệt hơn!
            </p>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {[5, 7, 8].map((hours) => (
                <button
                  key={hours}
                  onClick={() => {
                    dispatch({ t: 'SLEEP', hours });
                    onClose();
                  }}
                  className="bg-indigo-950/60 hover:bg-indigo-900 text-indigo-200 border border-indigo-800/80 py-1.5 rounded font-mono font-bold text-xs transition-colors"
                >
                  Ngủ {hours}h
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
