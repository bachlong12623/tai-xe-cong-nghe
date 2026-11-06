import React from 'react';
import { VehicleState, EconomyState } from '../../sim/types';
import vehiclesData from '../../../data/vehicles.json';
import { Car, Zap, Check, Fuel, X } from 'lucide-react';

interface VehicleShopModalProps {
  currentVehicle: VehicleState;
  ownedVehicles: VehicleState[];
  economy: EconomyState;
  onBuyVehicle: (vehicleId: string, paymentMode: 'cash' | 'installment') => void;
  onSwitchVehicle: (vehicleId: string) => void;
  onClose: () => void;
}

export const VehicleShopModal: React.FC<VehicleShopModalProps> = ({
  currentVehicle,
  ownedVehicles,
  economy,
  onBuyVehicle,
  onSwitchVehicle,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-neutral-100">GARA XE & CỬA HÀNG PHƯƠNG TIỆN</h2>
              <span className="text-[11px] text-neutral-400">Xe máy xăng, xe điện tiết kiệm & Ô tô taxi 4 chỗ</span>
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
          <div className="space-y-3">
            {vehiclesData.map((v) => {
              const isOwned = ownedVehicles.some((ov) => ov.id === v.id);
              const isActive = currentVehicle.id === v.id;
              const isElectric = v.fuelType === 'electric';
              const isCar = v.category === 'car';

              return (
                <div
                  key={v.id}
                  className={`border rounded-xl p-3.5 flex flex-col gap-3 transition-colors ${
                    isActive
                      ? 'bg-neutral-950 border-emerald-500/80 shadow-md'
                      : isOwned
                      ? 'bg-neutral-950/80 border-neutral-700'
                      : 'bg-neutral-950/50 border-neutral-800/80'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200">
                        {isCar ? (
                          <Car className="w-5 h-5 text-amber-400" />
                        ) : isElectric ? (
                          <Zap className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Fuel className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-neutral-100">{v.name}</h3>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              Đang sử dụng
                            </span>
                          )}
                          {isOwned && !isActive && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-300">
                              Đã sở hữu
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{v.description}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-emerald-400">
                        {v.price.toLocaleString('vi-VN')} đ
                      </div>
                      <span className="text-[10px] text-neutral-400">
                        Trả trước góp: {(v.downPayment || 5000000).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>

                  {/* Specs Pill Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                      Nhiên liệu: <b className="text-neutral-100">{isElectric ? 'Điện (Pin)' : 'Xăng'}</b>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                      Tiêu hao:{' '}
                      <b className="text-neutral-100">
                        {isElectric ? '~1.25% pin/km' : `${v.fuelConsumptionPer100Km} L/100km`}
                      </b>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                      Êm ái: <b className="text-neutral-100">x{v.comfortModifier}</b>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                      Nhận đơn:{' '}
                      <b className={v.canDeliverFood ? 'text-emerald-400' : 'text-amber-400'}>
                        {v.canDeliverFood ? 'Đồ ăn & Chở khách' : 'Chỉ Chở khách (GrabCar)'}
                      </b>
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-900">
                    {isActive ? (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-4 h-4" /> Xe đang sẵn sàng trên đường
                      </span>
                    ) : isOwned ? (
                      <button
                        onClick={() => onSwitchVehicle(v.id)}
                        className="py-1 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-lg transition-colors"
                      >
                        Đổi sang xe này
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onBuyVehicle(v.id, 'installment')}
                          disabled={economy.cash < (v.downPayment || 5000000)}
                          className="py-1 px-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 text-xs font-semibold rounded-lg border border-neutral-700 transition-colors"
                        >
                          Mua trả góp (Trả trước {(v.downPayment || 5000000).toLocaleString('vi-VN')}đ)
                        </button>
                        <button
                          onClick={() => onBuyVehicle(v.id, 'cash')}
                          disabled={economy.cash < v.price}
                          className="py-1 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-black text-xs font-bold rounded-lg transition-colors"
                        >
                          Mua đứt tiền mặt
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-950/80 border-t border-neutral-800 flex justify-between items-center text-xs text-neutral-400">
          <span>Tiền mặt hiện có: <b className="text-emerald-400 font-mono">{economy.cash.toLocaleString('vi-VN')}đ</b></span>
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
