import React from 'react';
import { NpcMessage } from '../../sim/types';
import { MessageSquare, ShieldAlert, AlertTriangle, CloudRain, Utensils, TrendingUp, X } from 'lucide-react';

interface CommunityModalProps {
  messages: NpcMessage[];
  activeCsgtZones: string[];
  onClose: () => void;
}

export const CommunityModal: React.FC<CommunityModalProps> = ({ messages, activeCsgtZones, onClose }) => {
  const getCategoryBadge = (type: NpcMessage['type']) => {
    switch (type) {
      case 'police':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60">
            <ShieldAlert className="w-3 h-3" /> Chốt CSGT
          </span>
        );
      case 'traffic':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/60">
            <AlertTriangle className="w-3 h-3" /> Kẹt xe
          </span>
        );
      case 'flood':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60">
            <CloudRain className="w-3 h-3" /> Ngập nước
          </span>
        );
      case 'merchant':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <Utensils className="w-3 h-3" /> Quán ăn
          </span>
        );
      case 'demand':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-400 border border-purple-800/60">
            <TrendingUp className="w-3 h-3" /> Nổ đơn
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
            <MessageSquare className="w-3 h-3" /> Chia sẻ
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-neutral-100">KÊNH ĐÀM & CỘNG ĐỒNG BÁC TÀI</h2>
              <span className="text-[11px] text-neutral-400">Tin tức tức thời từ 12 bác tài đồng nghiệp TP.HCM</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active CSGT Warning Banner */}
        {activeCsgtZones.length > 0 && (
          <div className="px-4 py-2 bg-red-950/40 border-b border-red-900/40 flex items-center gap-2 text-xs text-red-300">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>
              Cảnh báo chốt CSGT tuần tra: Khu vực{' '}
              <b className="text-red-200 uppercase">{activeCsgtZones.join(', ')}</b>. Anh em chạy cẩn thận, không vượt đèn!
            </span>
          </div>
        )}

        {/* Message Feed */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 min-h-[300px]">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs">
              Đang kết nối sóng đàm... Chưa có tin nhắn mới nào trong kênh.
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-neutral-950/80 border border-neutral-800/90 rounded-xl p-3 flex gap-3 hover:border-neutral-700 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-lg shrink-0 border border-neutral-700">
                  {msg.avatar}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-neutral-200">{msg.npcName}</span>
                      {getCategoryBadge(msg.type)}
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {Math.round(msg.reliability * 100)}% uy tín
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono">{msg.timestampFormatted}</span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-950/80 border-t border-neutral-800 flex justify-between items-center text-[11px] text-neutral-500">
          <span>* Độ tin cậy phản ánh kinh nghiệm của từng bác tài. Một số tin có thể bị lỗi thời.</span>
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
