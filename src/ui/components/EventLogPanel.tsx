import React, { useRef } from 'react';
import { LogMessage } from '../../sim/types';
import { Terminal, Clock } from 'lucide-react';

interface EventLogPanelProps {
  logs: LogMessage[];
}

export const EventLogPanel: React.FC<EventLogPanelProps> = ({ logs }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const getLogTypeBadge = (type: LogMessage['type']) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800';
      case 'warning':
        return 'bg-amber-950/80 text-amber-400 border-amber-800';
      case 'danger':
        return 'bg-red-950/80 text-red-400 border-red-800';
      case 'event':
        return 'bg-purple-950/80 text-purple-300 border-purple-800';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex flex-col gap-2 shadow-lg h-44">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wide">
            Nhật ký hành trình & Sự kiện
          </h3>
        </div>
        <span className="text-[10px] text-neutral-500 font-mono">
          {logs.length} bản ghi
        </span>
      </div>

      {/* Log Entries Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1 font-mono text-xs select-text"
      >
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-2 bg-neutral-950/70 p-1.5 rounded border border-neutral-800/60 leading-relaxed text-[11px]"
          >
            <span className="text-[10px] text-neutral-500 flex items-center gap-0.5 shrink-0 pt-0.5">
              <Clock className="w-2.5 h-2.5" />
              {log.timeFormatted}
            </span>

            <span
              className={`text-[9px] uppercase px-1 py-0.2 rounded border shrink-0 font-semibold ${getLogTypeBadge(
                log.type
              )}`}
            >
              {log.type}
            </span>

            <span className="text-neutral-200 break-words flex-1">
              {log.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
