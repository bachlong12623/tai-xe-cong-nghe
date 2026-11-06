import React from 'react';
import { DriverSkills } from '../../sim/types';
import skillsData from '../../../data/skills.json';
import { Award, CheckCircle, Zap, Shield, Sparkles, X } from 'lucide-react';

interface SkillsModalProps {
  skills: DriverSkills;
  onClose: () => void;
}

export const SkillsModal: React.FC<SkillsModalProps> = ({ skills, onClose }) => {
  const getSkillIcon = (id: string) => {
    switch (id) {
      case 'streetKnowledge':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'communication':
        return <Sparkles className="w-5 h-5 text-blue-400" />;
      case 'itemHandling':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'defensiveDriving':
        return <Shield className="w-5 h-5 text-indigo-400" />;
      case 'stressResilience':
        return <Award className="w-5 h-5 text-purple-400" />;
      default:
        return <Award className="w-5 h-5 text-neutral-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-neutral-100">KỸ NĂNG NGHỀ TÀI XẾ (5 CÂY KỸ NĂNG)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          <p className="text-xs text-neutral-400 leading-relaxed">
            Kỹ năng tự động tích lũy kinh nghiệm (EXP) qua từng km chạy xe, số chuyến hoàn thành, tiền tip nhận được và khả năng ứng phó các tình huống khắc nghiệt trên đường phố.
          </p>

          <div className="space-y-3">
            {skillsData.skills.map((sDef) => {
              const currentSkill = skills[sDef.id as keyof DriverSkills] || { level: 0, exp: 0 };
              const maxLvl = sDef.maxLevel || 5;
              const thresholds = sDef.xpThresholds || [0, 100, 250, 500, 1000, 2000];
              const nextThreshold = currentSkill.level < maxLvl ? thresholds[currentSkill.level + 1] : thresholds[maxLvl];
              const prevThreshold = thresholds[currentSkill.level] || 0;
              const progressPct =
                currentSkill.level >= maxLvl
                  ? 100
                  : Math.min(100, Math.max(0, ((currentSkill.exp - prevThreshold) / (nextThreshold - prevThreshold)) * 100));

              return (
                <div
                  key={sDef.id}
                  className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 flex flex-col gap-2 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800">
                        {getSkillIcon(sDef.id)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-neutral-200">{sDef.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Cấp {currentSkill.level}/{maxLvl}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400">{sDef.description}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-mono text-neutral-300 font-bold">{currentSkill.exp}</span>
                      <span className="text-neutral-500 font-mono text-[10px]">/{nextThreshold} EXP</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* Active Buff Summary */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-900 text-neutral-400">
                    <span>
                      Hiệu ứng hiện tại:
                      <b className="text-emerald-400 ml-1">
                        {sDef.id === 'streetKnowledge' && `-${currentSkill.level * 3}% thời gian di chuyển`}
                        {sDef.id === 'communication' && `+${currentSkill.level * 3}% tỷ lệ nhận tiền Tip`}
                        {sDef.id === 'itemHandling' && `-${currentSkill.level * 15}% rủi ro đổ vỡ đồ ăn`}
                        {sDef.id === 'defensiveDriving' && `-${currentSkill.level * 6}% nguy cơ tai nạn`}
                        {sDef.id === 'stressResilience' && `-${currentSkill.level * 10}% hao hụt Tinh thần`}
                      </b>
                    </span>
                    {currentSkill.level < maxLvl && (
                      <span className="text-neutral-500 text-[10px]">
                        Cần thêm {Math.max(0, nextThreshold - currentSkill.exp)} EXP để thăng cấp
                      </span>
                    )}
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
