import React from 'react';
import { PoliceFineEvent } from '../../sim/types';
import { ShieldAlert } from 'lucide-react';

interface PoliceFineModalProps {
  fine: PoliceFineEvent;
  onDismiss: () => void;
}

export const PoliceFineModal: React.FC<PoliceFineModalProps> = ({ fine, onDismiss }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border-2 border-red-600 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-red-950/80 p-4 border-b border-red-900/60 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-900/60 text-red-300">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black text-red-200 tracking-wide">BIÊN BẢN VI PHẠM GIAO THÔNG</h2>
            <span className="text-[11px] text-red-300 font-medium">Lực lượng CSGT TP.HCM xử phạt tại chỗ</span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-2">
            <div className="text-xs text-neutral-400">
              Lỗi vi phạm: <b className="text-neutral-100">{fine.reason}</b>
            </div>
            <div className="text-xs text-neutral-400">
              Địa điểm chốt: <b className="text-amber-400">{fine.zoneName}</b>
            </div>
            <div className="text-xs text-neutral-400 flex items-center justify-between pt-2 border-t border-neutral-800">
              <span>Mức phạt tiền:</span>
              <span className="font-mono text-base font-black text-red-400">
                -{fine.fineAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Tiền phạt đã được khấu trừ trực tiếp vào tiền mặt hoặc ví app tài xế. Tinh thần của bạn bị sa sút nặng nề sau lần bị thổi phạt này!
          </p>

          <button
            onClick={onDismiss}
            className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-900/30 transition-colors uppercase tracking-wider"
          >
            Đã nộp phạt & Tiếp tục hành trình
          </button>
        </div>
      </div>
    </div>
  );
};
