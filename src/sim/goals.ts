import goalsData from '../../data/goals.json';
import { CharacterGoal, LoanState, LogMessage } from './types';

export function createDefaultGoal(): CharacterGoal {
  const first = goalsData.availableGoals[0];
  return {
    id: first.id,
    title: first.title,
    targetAmount: first.targetAmount,
    currentAmount: 0,
    achieved: false,
  };
}

export function createDefaultLoan(): LoanState {
  return {
    totalPrincipal: goalsData.loanRules.defaultBikeInstallment.initialDebt,
    dailyInterestRate: 0.001, // ~3% monthly installment
    daysOverdue: 0,
  };
}

export function contributeGoal(
  goal: CharacterGoal,
  amount: number,
  logs: LogMessage[],
  minute: number,
  timeFormatted: string
): { updatedGoal: CharacterGoal; actualContributed: number } {
  if (amount <= 0 || goal.achieved) {
    return { updatedGoal: goal, actualContributed: 0 };
  }

  const remaining = goal.targetAmount - goal.currentAmount;
  const toAdd = Math.min(amount, remaining);
  const newAmount = goal.currentAmount + toAdd;
  const nowAchieved = newAmount >= goal.targetAmount;

  if (nowAchieved && !goal.achieved) {
    logs.unshift({
      id: `goal-achieved-${goal.id}-${minute}`,
      minute,
      timeFormatted,
      text: `🏆 CHÚC MỪNG BẠN ĐÃ HOÀN THÀNH MỤC TIÊU: [${goal.title}]! Tinh thần tăng vọt!`,
      type: 'event',
    });
  } else {
    logs.unshift({
      id: `goal-contribute-${minute}`,
      minute,
      timeFormatted,
      text: `💰 Đã tích lũy ${toAdd.toLocaleString('vi-VN')}đ vào mục tiêu "${goal.title}" (Đạt ${Math.round((newAmount / goal.targetAmount) * 100)}%)`,
      type: 'info',
    });
  }

  return {
    updatedGoal: {
      ...goal,
      currentAmount: newAmount,
      achieved: nowAchieved,
    },
    actualContributed: toAdd,
  };
}

