import React, { useState } from 'react';
import { CharacterGoal, LoanState, EconomyState } from '../../sim/types';
import goalsData from '../../../data/goals.json';
import { Target, Trophy, Landmark, PlusCircle, ArrowDownCircle, X, AlertTriangle } from 'lucide-react';

interface GoalsModalProps {
  goal: CharacterGoal;
  loan: LoanState;
  economy: EconomyState;
  onSetGoal: (goalId: string) => void;
  onContributeGoal: (amount: number) => void;
  onTakeEmergencyLoan: (amount: number) => void;
  onRepayLoan: (amount: number) => void;
  onClose: () => void;
}

export const GoalsModal: React.FC<GoalsModalProps> = ({
  goal,
  loan,
  economy,
  onSetGoal,
  onContributeGoal,
  onTakeEmergencyLoan,
  onRepayLoan,
  onClose,
}) => {
  const [depositInput, setDepositInput] = useState<number>(100000);
  const [repayInput, setRepayInput] = useState<number>(200000);

  const goalProgressPct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-neutral-100">MỤC TIÊU CUỘC ĐỜI & TÀI CHÍNH</h2>
              <span className="text-[11px] text-neutral-400">Động lực mưu sinh và quản lý nợ vay trả góp</span>
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
        <div className="p-4 overflow-y-auto space-y-5">
          {/* Section 1: Active Goal Card */}
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Mục tiêu hiện tại</span>
              </div>
              {goal.achieved ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  ĐÃ HOÀN THÀNH 🏆
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-amber-400">{goalProgressPct}%</span>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-neutral-100">{goal.title}</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Đã tích lũy: <b className="text-emerald-400 font-mono">{goal.currentAmount.toLocaleString('vi-VN')}đ</b> /{' '}
                <span className="font-mono">{goal.targetAmount.toLocaleString('vi-VN')}đ</span>
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${goal.achieved ? 'bg-emerald-400' : 'bg-amber-400'}`}
                style={{ width: `${goalProgressPct}%` }}
              />
            </div>

            {/* Deposit Action */}
            {!goal.achieved && (
              <div className="flex items-center gap-2 pt-2 border-t border-neutral-900">
                <input
                  type="number"
                  step="50000"
                  min="50000"
                  max={economy.cash}
                  value={depositInput}
                  onChange={(e) => setDepositInput(Number(e.target.value))}
                  className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-neutral-200 font-mono w-32 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => onContributeGoal(depositInput)}
                  disabled={economy.cash < depositInput}
                  className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-black font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Gửi tiết kiệm vào mục tiêu
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Choose different goal */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Đổi mục tiêu khác</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {goalsData.availableGoals.map((g) => (
                <button
                  key={g.id}
                  onClick={() => onSetGoal(g.id)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition-colors flex flex-col justify-between gap-1.5 ${
                    goal.id === g.id
                      ? 'bg-neutral-800 border-amber-500/50 text-neutral-100'
                      : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span className="font-bold text-neutral-200">{g.title}</span>
                  <span className="text-[10px] text-neutral-400">{g.description}</span>
                  <span className="text-[11px] font-mono text-amber-400 font-bold mt-1">
                    Cần: {g.targetAmount.toLocaleString('vi-VN')}đ
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Loan & Installment */}
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Nợ mua xe trả góp & Vay nóng
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-red-400">
                Dư nợ: {loan.totalPrincipal.toLocaleString('vi-VN')}đ
              </span>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Mỗi ngày lúc 05:00 sáng hệ thống tự động trích 50.000đ từ tiền mặt hoặc ví app để thanh toán góp xe. Lãi suất vay nợ khoảng ~3%/tháng.
            </p>

            {/* Repay Loan Action */}
            {loan.totalPrincipal > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-neutral-900">
                <input
                  type="number"
                  step="50000"
                  min="50000"
                  max={Math.min(economy.cash, loan.totalPrincipal)}
                  value={repayInput}
                  onChange={(e) => setRepayInput(Number(e.target.value))}
                  className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-neutral-200 font-mono w-32 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => onRepayLoan(repayInput)}
                  disabled={economy.cash < repayInput || loan.totalPrincipal <= 0}
                  className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowDownCircle className="w-3.5 h-3.5" />
                  Trả bớt nợ gốc
                </button>
              </div>
            )}

            {/* Emergency Loan Quick Options */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-900">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3 h-3 text-amber-400" /> Ứng tiền mặt khẩn cấp (khi xe hỏng nặng hoặc nằm viện):
              </span>
              <div className="flex flex-wrap gap-2">
                {goalsData.loanRules.emergencyLoanOptions.map((opt) => (
                  <button
                    key={opt.amount}
                    onClick={() => onTakeEmergencyLoan(opt.amount)}
                    className="py-1 px-2.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:border-amber-500 text-[11px] text-neutral-300 transition-colors font-mono"
                  >
                    +{(opt.amount / 1000000).toFixed(0)} triệu (Lãi {(opt.dailyInterestRate * 100).toFixed(1)}%/ngày)
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-950/80 border-t border-neutral-800 flex justify-between items-center text-xs text-neutral-400">
          <span>Tiền mặt hiện có: <b className="text-emerald-400 font-mono">{economy.cash.toLocaleString('vi-VN')}đ</b></span>
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
