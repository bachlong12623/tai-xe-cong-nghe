import React from 'react';
import { getAllAchievements } from '../../sim/achievements';
import { Trophy, CheckCircle2, Lock, X } from 'lucide-react';

interface AchievementsModalProps {
  unlockedIds: string[];
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ unlockedIds, onClose }) => {
  const allAchievements = getAllAchievements();
  const unlockedCount = unlockedIds.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-neutral-100">DANH HIỆU & THÀNH TỰU ({unlockedCount}/{allAchievements.length})</h2>
              <span className="text-[11px] text-neutral-400">Các cột mốc đáng nhớ trong sự nghiệp tài xế</span>
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
        <div className="p-4 overflow-y-auto space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {allAchievements.map((ach) => {
              const isUnlocked = unlockedIds.includes(ach.id);

              return (
                <div
                  key={ach.id}
                  className={`p-3 rounded-xl border flex gap-3 transition-colors ${
                    isUnlocked
                      ? 'bg-neutral-950 border-amber-500/60 shadow-md shadow-amber-500/5'
                      : 'bg-neutral-950/40 border-neutral-800/80 opacity-60'
                  }`}
                >
                  <div className="text-2xl shrink-0 p-1 flex items-center justify-center">
                    {isUnlocked ? ach.icon : '🔒'}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-xs font-bold ${isUnlocked ? 'text-amber-300' : 'text-neutral-400'}`}>
                        {ach.title}
                      </h3>
                      {isUnlocked ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Lock className="w-3 h-3 text-neutral-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-snug">{ach.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-950/80 border-t border-neutral-800 flex justify-end">
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

