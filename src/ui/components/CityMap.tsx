import React from 'react';
import { ViewModel } from '../../sim/engine';
import { Action, GameState, DrivingStyle } from '../../sim/types';
import zonesData from '../../../data/zones.json';
import spotsData from '../../../data/spots.json';
import { Navigation, Zap } from 'lucide-react';

interface CityMapProps {
  state: GameState;
  view: ViewModel;
  dispatch: (action: Action) => void;
}

export const CityMap: React.FC<CityMapProps> = ({ state, view, dispatch }) => {
  const currentZoneId = state.location.currentZoneId;
  const currentSpotId = state.location.currentSpotId;

  // Spots available in the current zone
  const spotsInCurrentZone = spotsData.filter((sp) => sp.zoneId === currentZoneId);
  const otherSpots = spotsData.filter((sp) => sp.zoneId !== currentZoneId);

  const drivingStyles: { id: DrivingStyle; label: string; tooltip: string }[] = [
    { id: 'safe', label: 'An toàn', tooltip: 'Tuân thủ luật, 0% rủi ro CSGT, giảm 30% tai nạn' },
    { id: 'normal', label: 'Bình thường', tooltip: 'Tốc độ tiêu chuẩn luồng giao thông' },
    { id: 'rush', label: 'Gấp rút', tooltip: 'Tiết kiệm 2-4 phút/cuốc, 10% rủi ro bị CSGT phạt' },
    { id: 'shortcut', label: 'Đường tắt', tooltip: 'Leo vỉa hè/ngược chiều, nhanh nhất nhưng 18% phạt' },
  ];

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3 shadow-lg h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2.5">
        <div>
          <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-emerald-400" />
            BẢN ĐỒ 12 KHU VỰC TP.HCM
          </h2>
          <span className="text-[11px] text-neutral-400">
            Vị trí: <b className="text-emerald-300">{view.location.zoneName}</b> — {view.location.spotName}
          </span>
        </div>

        {/* Spot selection dropdown */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <label className="text-neutral-400 text-[11px]">Tuyến:</label>
            <div className="flex bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
              {(['fast', 'light', 'dry'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => dispatch({ t: 'SET_ROUTE_MODE', mode: m })}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                    view.location.routeMode === m
                      ? 'bg-emerald-500 text-black'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {m === 'fast' ? 'Nhanh' : m === 'light' ? 'Né kẹt' : 'Né ngập'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-neutral-400 text-[11px]">Điểm chờ:</label>
            <select
              value={currentSpotId || ''}
              onChange={(e) => dispatch({ t: 'SET_SPOT', spotId: e.target.value || null })}
              className="bg-neutral-950 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- Lang thang tìm khách --</option>
              <optgroup label={`Tại ${view.location.zoneName}`}>
                {spotsInCurrentZone.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Các khu vực khác">
                {otherSpots.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Driving Style Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-neutral-950/80 rounded-lg border border-neutral-800/80 text-xs">
        <span className="text-[11px] text-neutral-400 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Phong cách chạy xe:
        </span>
        <div className="flex items-center gap-1">
          {drivingStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => dispatch({ t: 'SET_DRIVING_STYLE', style: style.id })}
              title={style.tooltip}
              className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                view.drivingStyle === style.id
                  ? style.id === 'safe'
                    ? 'bg-blue-500 text-white'
                    : style.id === 'rush'
                    ? 'bg-amber-500 text-black'
                    : style.id === 'shortcut'
                    ? 'bg-red-500 text-white'
                    : 'bg-emerald-500 text-black'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG 2D Graph Map */}
      <div className="relative w-full h-[380px] bg-neutral-950/90 rounded-lg border border-neutral-800/90 overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 480 380"
          className="w-full h-full select-none"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1f242d" strokeWidth="0.5" />
            </pattern>
            {/* Active Node Glow */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Render Connections */}
          {zonesData.map((zone) =>
            zone.connections.map((conn) => {
              const targetZone = zonesData.find((z) => z.id === conn.target);
              if (!targetZone) return null;
              
              // Highlight route if an active trip connects these zones
              const activeTrip = view.activeTrip;
              const isTripRoute = activeTrip && (
                (zone.id === activeTrip.pickupZoneId && targetZone.id === activeTrip.dropoffZoneId) ||
                (targetZone.id === activeTrip.pickupZoneId && zone.id === activeTrip.dropoffZoneId) ||
                (zone.id === currentZoneId && targetZone.id === activeTrip.dropoffZoneId)
              );

              return (
                <line
                  key={`${zone.id}-${conn.target}`}
                  x1={zone.x}
                  y1={zone.y + 40}
                  x2={targetZone.x}
                  y2={targetZone.y + 40}
                  stroke={isTripRoute ? '#f59e0b' : '#2d3748'}
                  strokeWidth={isTripRoute ? 3.5 : 1.5}
                  strokeDasharray={isTripRoute ? '5 3' : undefined}
                  className={isTripRoute ? 'animate-pulse' : undefined}
                />
              );
            })
          )}

          {/* Render Zones Nodes */}
          {zonesData.map((zone) => {
            const isCurrent = zone.id === currentZoneId;
            const isFlood = zone.floodProne && view.weather.isRainy;
            const hasCsgt = view.activeCsgtZones.includes(zone.id);

            return (
              <g
                key={zone.id}
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => dispatch({ t: 'MOVE_TO', targetZoneId: zone.id })}
              >
                {/* Outer ring for current position */}
                {isCurrent && (
                  <circle
                    cx={zone.x}
                    cy={zone.y + 40}
                    r={22}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={2}
                    className="animate-ping opacity-60"
                  />
                )}

                {/* Base circle node */}
                <circle
                  cx={zone.x}
                  cy={zone.y + 40}
                  r={isCurrent ? 14 : 9}
                  fill={isCurrent ? '#10b981' : isFlood ? '#3b82f6' : '#1e293b'}
                  stroke={isCurrent ? '#ecfdf5' : '#475569'}
                  strokeWidth={isCurrent ? 2.5 : 1.5}
                  filter={isCurrent ? 'url(#glow)' : undefined}
                />

                {/* CSGT Patrol Indicator */}
                {hasCsgt && (
                  <g transform={`translate(${zone.x - 12}, ${zone.y + 12})`}>
                    <rect width="24" height="11" rx="3" fill="#dc2626" />
                    <text x="12" y="8" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
                      CSGT
                    </text>
                  </g>
                )}

                {/* Flood Indicator */}
                {isFlood && !hasCsgt && (
                  <circle
                    cx={zone.x + 10}
                    cy={zone.y + 32}
                    r={5}
                    fill="#3b82f6"
                  />
                )}

                {/* Label */}
                <text
                  x={zone.x}
                  y={zone.y + 60}
                  textAnchor="middle"
                  fill={isCurrent ? '#34d399' : '#94a3b8'}
                  fontSize={isCurrent ? 11 : 9.5}
                  fontWeight={isCurrent ? 'bold' : 'normal'}
                  className="pointer-events-none drop-shadow"
                >
                  {zone.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend Overlay */}
        <div className="absolute bottom-2 left-2 bg-neutral-900/90 border border-neutral-800 p-2 rounded text-[10px] text-neutral-400 flex flex-col gap-1 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Vị trí tài xế</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1 py-0.2 rounded bg-red-600 text-white text-[8px] font-bold">CSGT</span>
            <span>Chốt giao thông tuần tra</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Điểm ngập nước triều cường</span>
          </div>
        </div>

        {/* Trip Destination Indicator */}
        {view.activeTrip && (
          <div className="absolute top-2 right-2 bg-neutral-900/90 border border-neutral-800 p-2 rounded text-[11px] text-neutral-300 flex items-center gap-1.5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>
              Đang chở khách tới:{' '}
              <b className="text-amber-300">
                {zonesData.find((z) => z.id === view.activeTrip?.dropoffZoneId)?.name || 'Điểm đến'}
              </b>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
