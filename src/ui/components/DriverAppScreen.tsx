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
  Power,
  Navigation,
  MapPin,
  UtensilsCrossed,
  Bike,
  Sparkles,
  UserCheck
} from 'lucide-react';

interface DriverAppScreenProps {
  state: GameState;
  view: ViewModel;
  dispatch: (action: Action) => void;
}

export const DriverAppScreen: React.FC<DriverAppScreenProps> = ({ state, view, dispatch }) => {
  const tierName = state.app.tier.toUpperCase();
  const getTierColor = () => {
    switch (state.app.tier) {
      case 'bronze': return 'text-amber-600 bg-amber-950/40 border-amber-800';
      case 'silver': return 'text-slate-300 bg-slate-800/60 border-slate-600';
      case 'gold': return 'text-yellow-400 bg-yellow-950/50 border-yellow-600';
      case 'diamond': return 'text-cyan-400 bg-cyan-950/50 border-cyan-500';
    }
  };

  const offer = view.currentOffer;
  const trip = view.activeTrip;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3.5 shadow-lg h-full">
      {/* Smartphone Mockup Frame Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-neutral-100">APP TÀI XẾ CÔNG NGHỆ</h2>
        </div>
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${view.isOnline ? 'bg-emerald-500 animate-ping' : 'bg-neutral-600'}`} />
          <span className="text-[11px] text-neutral-400 font-mono">v4.0 (Giả lập)</span>
        </div>
      </div>

      {/* Driver Profile Card */}
      <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-sm text-neutral-950 shadow-md">
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
                Nhận: <b className="text-neutral-200">{(state.app.acceptanceRate * 100).toFixed(0)}%</b>
              </span>
              <span>
                Đã chạy: <b className="text-neutral-200">{state.app.totalTripsCompleted}</b>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dynamic View: Offer vs Active Trip vs Radar vs Offline */}
      <div className="flex-1 min-h-[220px] bg-neutral-950 rounded-xl border border-neutral-800 p-3.5 flex flex-col justify-between relative overflow-hidden">
        {/* CASE 1: INCOMING ORDER OFFER */}
        {offer ? (
          <div className="flex flex-col gap-2.5 animate-fadeIn">
            {/* Offer Top Banner */}
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-amber-400 animate-pulse">
                {offer.type === 'food' ? (
                  <UtensilsCrossed className="w-4 h-4 text-orange-400" />
                ) : (
                  <Bike className="w-4 h-4 text-emerald-400" />
                )}
                {offer.type === 'food' ? 'ĐƠN GIAO ĐỒ ĂN MỚI' : 'CUỐC CHỞ KHÁCH MỚI'}
              </span>

              {/* Countdown badge */}
              <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {offer.countdownSeconds}s
              </span>
            </div>

            {/* Countdown bar */}
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(offer.countdownSeconds / 12) * 100}%` }}
              />
            </div>

            {/* Fare & Surge Display */}
            <div className="bg-neutral-900/90 p-2.5 rounded-lg border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-neutral-400 block">Cước hiển thị trên App:</span>
                <span className="text-lg font-black text-emerald-400 font-mono tracking-tight">
                  {offer.grossFare.toLocaleString('vi-VN')} đ
                </span>
                <span className="text-[10px] text-neutral-400 block">
                  (Thực nhận sau phí: ~{offer.netFare.toLocaleString('vi-VN')}đ)
                </span>
              </div>

              <div className="flex flex-col items-end gap-1">
                {offer.surgeMultiplier > 1.0 && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    +{Math.round((offer.surgeMultiplier - 1) * 100)}% Giờ cao điểm
                  </span>
                )}
                <span className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded font-mono">
                  {offer.paymentMethod === 'cash' ? '💵 Tiền mặt' : '💳 Thẻ / Ví điện tử'}
                </span>
              </div>
            </div>

            {/* Addresses and Distances */}
            <div className="space-y-1.5 text-xs text-neutral-300">
              <div className="flex items-start gap-2">
                <Navigation className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-neutral-400 block">Điểm đón ({offer.pickupDistanceKm} km):</span>
                  <span className="font-semibold text-neutral-200">{offer.pickupAddress}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-neutral-400 block">Điểm đến ({offer.tripDistanceKm} km):</span>
                  <span className="font-semibold text-neutral-200">{offer.dropoffAddress}</span>
                </div>
              </div>

              {offer.foodItems && (
                <div className="text-[11px] text-neutral-400 bg-neutral-900/60 p-1.5 rounded border border-neutral-800/80">
                  Món: <b className="text-orange-300">{offer.foodItems}</b>
                </div>
              )}
            </div>

            {/* Action Buttons: Accept / Reject */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-1 border-t border-neutral-800/80">
              <button
                onClick={() => dispatch({ t: 'REJECT_OFFER', id: offer.id })}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2 rounded-lg font-bold text-xs border border-neutral-700 transition-colors"
              >
                Bỏ qua
              </button>
              <button
                onClick={() => dispatch({ t: 'ACCEPT_OFFER', id: offer.id })}
                className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-bold text-xs shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/50 transition-colors animate-pulse"
              >
                NHẬN CUỐC NGAY
              </button>
            </div>
          </div>
        ) : trip ? (
          /* CASE 2: ACTIVE TRIP IN PROGRESS */
          <div className="flex flex-col gap-2.5 animate-fadeIn">
            {/* Trip Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Bike className="w-4 h-4" />
                ĐANG THỰC HIỆN HÀNH TRÌNH
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded">
                +{trip.grossFare.toLocaleString('vi-VN')} đ
              </span>
            </div>

            {/* Current Stage Indicator */}
            <div className="bg-neutral-900 p-2.5 rounded-lg border border-neutral-800">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-neutral-200">
                  {trip.stage === 'TO_PICKUP'
                    ? trip.type === 'food'
                      ? '1. Đang đến quán ăn'
                      : '1. Đang đến đón khách'
                    : trip.stage === 'AT_MERCHANT_WAITING'
                    ? '2. Đang đợi quán làm món'
                    : '3. Đang giao tới điểm đến'}
                </span>
                <span className="text-emerald-400 font-mono font-bold text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ~{trip.stageMinutesRemaining} phút
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden mt-1.5">
                <div className="h-full bg-emerald-500 rounded-full animate-pulse w-3/4" />
              </div>
            </div>

            {/* Customer & Location Details */}
            <div className="bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/70 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-neutral-300 font-semibold">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  {trip.customerName}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {trip.customerProfile.label}
                </span>
              </div>

              <div className="text-[11px] text-neutral-400">
                Điểm đến: <b className="text-neutral-200">{trip.dropoffAddress}</b>
              </div>
              {trip.foodItems && (
                <div className="text-[11px] text-neutral-400">
                  Món: <b className="text-orange-300">{trip.foodItems}</b>
                </div>
              )}
            </div>
          </div>
        ) : view.isOnline ? (
          /* CASE 3: ONLINE WAITING FOR ORDERS */
          <div className="my-auto flex flex-col items-center justify-center text-center">
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
          </div>
        ) : (
          /* CASE 4: OFFLINE */
          <div className="my-auto flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-2 text-neutral-500">
              <Power className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-neutral-300">
              Ứng dụng đang Ngoại Tuyến
            </p>
            <p className="text-[11px] text-neutral-500 max-w-[220px] mt-0.5">
              Bật ứng dụng lên khi bạn đã sẵn sàng nhận cuốc chạy ngoài đường.
            </p>
          </div>
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
