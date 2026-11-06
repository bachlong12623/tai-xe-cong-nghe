import React, { useState } from 'react';
import { ViewModel } from '../../sim/engine';
import { Action } from '../../sim/types';
import { sound } from '../utils/sound';
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
  Power,
  Save,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  BarChart3
} from 'lucide-react';

interface TopBarProps {
  view: ViewModel;
  dispatch: (action: Action) => void;
  onSave?: () => void;
  onReset?: () => void;
  onOpenAchievements?: () => void;
  onOpenStatistics?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  view,
  dispatch,
  onSave,
  onReset,
  onOpenAchievements,
  onOpenStatistics,
}) => {
  const [saveToast, setSaveToast] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.isMuted);

  const handleManualSave = () => {
    if (onSave) {
      onSave();
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2000);
    }
  };

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      sound.playOrderPing();
    }
  };

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

        {/* Festive Tet Badge */}
        {view.isTetSeason && (
          <span className="px-2 py-0.5 rounded bg-red-600 text-amber-200 text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
            <span>🧧</span> TẾT NGUYÊN ĐÁN
          </span>
        )}

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

      {/* Finances, Speed Controller, Tools */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Money */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-neutral-950/90 border border-emerald-900/60 px-2.5 py-1.5 rounded-lg">
            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-neutral-400 text-[11px] hidden sm:inline">Tiền mặt:</span>
            <span className="font-bold text-emerald-300 font-mono">{view.cashFormatted}</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 bg-neutral-950/90 border border-neutral-800 px-2.5 py-1.5 rounded-lg">
            <Wallet className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-neutral-400 text-[11px]">Ví App:</span>
            <span className="font-bold text-cyan-300 font-mono">{view.appWalletFormatted}</span>
          </div>
        </div>

        {/* Difficulty Selector */}
        <select
          value={view.difficulty}
          onChange={(e) => dispatch({ t: 'SET_DIFFICULTY', difficulty: e.target.value as any })}
          className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-[11px] text-neutral-300 font-semibold focus:outline-none focus:border-emerald-500 hidden sm:block"
        >
          <option value="easy">Dễ thở</option>
          <option value="normal">Tiêu chuẩn</option>
          <option value="hard">Khắc nghiệt</option>
        </select>

        {/* Sound Mute Toggle */}
        <button
          onClick={toggleSound}
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-emerald-400 transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-neutral-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Achievements Modal Trigger */}
        {onOpenAchievements && (
          <button
            onClick={onOpenAchievements}
            title="Thành tựu & Danh hiệu"
            className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-amber-400 transition-colors flex items-center gap-1 text-xs"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden xl:inline text-[11px] font-bold text-neutral-300">
              {view.unlockedAchievements.length}
            </span>
          </button>
        )}

        {/* Statistics Modal Trigger */}
        {onOpenStatistics && (
          <button
            onClick={onOpenStatistics}
            title="Báo cáo thống kê dài hạn"
            className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-blue-400 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-blue-400" />
          </button>
        )}

        {/* Time Speed Controls */}
        <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => dispatch({ t: 'SET_SPEED', speed: s })}
              title={s === 0 ? 'Tạm dừng' : `Tua nhanh x${s}`}
              className={`px-1.5 sm:px-2 py-1 text-xs font-mono font-bold rounded flex items-center gap-0.5 transition-all ${
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
          <span className="hidden sm:inline">{view.isOnline ? 'ĐANG BẬT APP' : 'TẮT APP'}</span>
        </button>

        {/* Save / Reset Tools */}
        <div className="flex items-center gap-1.5 border-l border-neutral-800 pl-2">
          <button
            onClick={handleManualSave}
            title="Lưu game vào trình duyệt"
            className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-emerald-400 transition-colors text-xs flex items-center gap-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden 2xl:inline">Lưu</span>
          </button>

          {onReset && (
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn chơi lại từ đầu không?')) {
                  onReset();
                }
              }}
              title="Chơi lại từ đầu"
              className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-rose-400 transition-colors text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {saveToast && (
            <span className="text-[10px] bg-emerald-500 text-black font-bold px-1.5 py-0.5 rounded animate-fadeIn">
              Đã lưu!
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
