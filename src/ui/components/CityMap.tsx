import React from 'react';
import { ViewModel } from '../../sim/engine';
import { Action, GameState } from '../../sim/types';
import zonesData from '../../../data/zones.json';
import spotsData from '../../../data/spots.json';
import { MapPin, Navigation, Droplets } from 'lucide-react';

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

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3 shadow-lg h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2.5">
        <div>
          <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-emerald-400" />
            BẢN ĐỒ KHU VỰC TP.HCM
          </h2>
          <span className="text-[11px] text-neutral-400">
            Vị trí hiện tại: <b className="text-emerald-300">{view.location.zoneName}</b> — {view.location.spotName}
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

      {/* SVG 2D Graph Map */}
      <div className="relative w-full h-[360px] bg-neutral-950/90 rounded-lg border border-neutral-800/90 overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 460 360"
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

                {/* Flood or Hazard Icon */}
                {isFlood && (
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
            <span>Vị trí của bạn ({view.location.zoneName})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-500" />
            <span>Khu vực khác</span>
          </div>
          {view.weather.isRainy && (
            <div className="flex items-center gap-1.5 text-blue-400">
              <Droplets className="w-3 h-3" />
              <span>Khu vực ngập nước khi mưa to</span>
            </div>
          )}
        </div>
      </div>

      {/* Spot Description & Benefits */}
      <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 text-xs">
        <div className="flex items-center justify-between text-neutral-300 font-semibold mb-1">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <MapPin className="w-3.5 h-3.5" />
            {view.location.spotName}
          </span>
          <span className="text-[11px] text-neutral-400">
            Khu vực: {view.location.zoneName}
          </span>
        </div>
        <p className="text-[11px] text-neutral-400">
          Chọn vị trí chờ đắc địa gần tòa nhà văn phòng, khu ăn uống hoặc bãi xe để tăng xác suất phát cuốc ngắn và đồ ăn.
        </p>
      </div>
    </div>
  );
};
