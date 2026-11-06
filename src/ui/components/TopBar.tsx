import React from 'react';
import { ViewModel } from '../../sim/engine';
import { Action } from '../../sim/types';
import { 
  Play, 
  Pause, 
  FastForward, 
  Wallet, 
  Banknote, 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudLightning,
  Power
} from 'lucide-react';

interface TopBarProps {
  view: ViewModel;
  dispatch: (action: Action) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ view, dispatch }) => {
  const renderWeatherIcon = () => {
    switch (view.weather.type) {
      case 'sunny': return <Sun className="w-4 h-4 text-amber-400" />;
      case 'cloudy': return <Cloud className="w-4 h-4 text-slate-300" />;
      case 'light_rain': return <CloudRain className="w-4 h-4 text-blue-400" />;
      case 'heavy_rain': return <CloudRain className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'storm': return <CloudLightning className="w-4 h-4 text-purple-400 animate-bounce" />;
      default: return <Sun className="w-4 h-4 text-amber-400" />;
    }
  };

  const speeds: Array<0 | 1 | 2 | 4 | 8> = [0, 1, 2, 4, 8];

  return (
    <header className="bg-neutral-900/90 border-b border-neutral-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 backdrop-blur-md">
      {/* Brand & Time */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-extrabold text-base tracking-wide bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            TÀI XẾ CÔNG NGHỆ
          </span>
        </div>

        <div className="h-5 w-px bg-neutral-700 hidden sm:block" />

        <div className="flex items-center gap-2 bg-neutral-950/70 border border-neutral-800 px-3 py-1 rounded-lg">
          <span className="text-xs font-semibold text-emerald-400 font-mono tracking-wider">
            {view.timeFormatted}
          </span>
        </div>

        {/* Weather Badge */}
        <div className="hidden md:flex items-center gap-1.5 bg-neutral-800/80 px-2.5 py-1 rounded-md text-xs border border-neutral-700/60">
          {renderWeatherIcon()}
          <span className="text-neutral-200">{view.weather.temperature}°C</span>
          <span className="text-neutral-400 text-[11px]">({view.weather.label})</span>
        </div>
      </div>

      {/* Finances & Speed Controller */}
      <div className="flex items-center gap-3">
        {/* Money */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-neutral-950/90 border border-emerald-900/60 px-2.5 py-1.5 rounded-lg">
            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-neutral-400 text-[11px]">Tiền mặt:</span>
            <span className="font-bold text-emerald-300 font-mono">{view.cashFormatted}</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 bg-neutral-950/90 border border-neutral-800 px-2.5 py-1.5 rounded-lg">
            <Wallet className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-neutral-400 text-[11px]">Ví App:</span>
            <span className="font-bold text-cyan-300 font-mono">{view.appWalletFormatted}</span>
          </div>
        </div>

        {/* Time Speed Controls */}
        <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => dispatch({ t: 'SET_SPEED', speed: s })}
              title={s === 0 ? 'Tạm dừng' : `Tua nhanh x${s}`}
              className={`px-2 py-1 text-xs font-mono font-bold rounded flex items-center gap-0.5 transition-all ${
                view.speed === s
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
              }`}
            >
              {s === 0 ? (
                <Pause className="w-3 h-3 fill-current" />
              ) : s === 1 ? (
                <Play className="w-3 h-3 fill-current" />
              ) : (
                <>
                  <FastForward className="w-3 h-3" />
                  <span>x{s}</span>
                </>
              )}
            </button>
          ))}
        </div>

        {/* Online/Offline Toggle Button */}
        <button
          onClick={() => dispatch(view.isOnline ? { t: 'GO_OFFLINE' } : { t: 'GO_ONLINE' })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
            view.isOnline
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 ring-2 ring-emerald-400/50'
              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700'
          }`}
        >
          <Power className={`w-3.5 h-3.5 ${view.isOnline ? 'animate-pulse text-white' : 'text-neutral-400'}`} />
          <span>{view.isOnline ? 'ĐANG BẬT APP' : 'TẮT APP'}</span>
        </button>
      </div>
    </header>
  );
};
