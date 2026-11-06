import React from 'react';
import { Home, Sparkles } from 'lucide-react';

interface TetHolidayModalProps {
  onChoose: (goHome: boolean) => void;
  onClose: () => void;
}

export const TetHolidayModal: React.FC<TetHolidayModalProps> = ({ onChoose, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border-2 border-red-500 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-red-900 via-amber-900 to-red-950 p-4 border-b border-amber-600/40 text-center space-y-1">
          <div className="text-3xl">🧧 🌸 🏮</div>
          <h2 className="text-base font-black text-amber-200 tracking-wide uppercase">
            TẾT NGUYÊN ĐÁN ĐANG ĐẾN GẦN!
          </h2>
          <p className="text-xs text-amber-300">
            27 Tháng Chạp — Người người tấp nập kéo va li ra bến xe về quê
          </p>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-neutral-300 leading-relaxed text-center">
            Một năm dãi nắng dầm mưa trên từng góc phố Sài Gòn sắp khép lại. Lúc này, bạn đứng trước sự lựa chọn lớn nhất của người tài xế xa quê:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option 1: Về quê ăn Tết */}
            <button
              onClick={() => {
                onChoose(true);
                onClose();
              }}
              className="p-4 rounded-xl bg-neutral-950 border border-amber-500/60 hover:bg-neutral-900 flex flex-col items-center text-center gap-2 transition-all hover:scale-[1.02] shadow-lg group"
            >
              <div className="p-3 rounded-full bg-red-950 text-amber-400 group-hover:bg-red-900">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xs text-amber-300">VỀ QUÊ ĐÓN TẾT VỚI MẸ</h3>
              <p className="text-[11px] text-neutral-400">
                Vé xe Tết: <b>800.000đ</b>. Nghỉ ngơi 3 ngày Mùng 1–3. Sức khỏe & Tinh thần phục hồi <b>100%</b>, xóa sạch nợ ngủ!
              </p>
            </button>

            {/* Option 2: Ở lại cày xuyên Tết */}
            <button
              onClick={() => {
                onChoose(false);
                onClose();
              }}
              className="p-4 rounded-xl bg-neutral-950 border border-neutral-700 hover:border-emerald-500 hover:bg-neutral-900 flex flex-col items-center text-center gap-2 transition-all hover:scale-[1.02] shadow-lg group"
            >
              <div className="p-3 rounded-full bg-emerald-950 text-emerald-400 group-hover:bg-emerald-900">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xs text-emerald-300">Ở LẠI SÀI GÒN CÀY TẾT</h3>
              <p className="text-[11px] text-neutral-400">
                Giá cước cao vọt (Surge <b>x1.6–x2.0</b>), tiền thưởng Tết & tip hậu hĩnh. Cơ hội kiếm tiền triệu mỗi ngày để đổi đời!
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
