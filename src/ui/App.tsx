import React, { useState } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { TopBar } from './components/TopBar';
import { CharacterPanel } from './components/CharacterPanel';
import { CityMap } from './components/CityMap';
import { DriverAppScreen } from './components/DriverAppScreen';
import { EventLogPanel } from './components/EventLogPanel';
import { EatModal, DrinkModal, SleepModal } from './components/ActionModals';
import { DailySummaryModal } from './components/DailySummaryModal';
import { EventModal } from './components/EventModal';
import { MaintenanceModal } from './components/MaintenanceModal';
import { SkillsModal } from './components/SkillsModal';
import { CommunityModal } from './components/CommunityModal';
import { GoalsModal } from './components/GoalsModal';
import { VehicleShopModal } from './components/VehicleShopModal';
import { PoliceFineModal } from './components/PoliceFineModal';
import { User, Map, Smartphone, Terminal } from 'lucide-react';

export const App: React.FC = () => {
  const { state, view, dispatch, saveGameNow, resetGame } = useGameEngine();

  // Modals state
  const [isEatModalOpen, setIsEatModalOpen] = useState(false);
  const [isDrinkModalOpen, setIsDrinkModalOpen] = useState(false);
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isVehicleShopModalOpen, setIsVehicleShopModalOpen] = useState(false);

  // Mobile active tab
  const [mobileTab, setMobileTab] = useState<'char' | 'map' | 'app' | 'logs'>('char');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Bar with Time, Finances, Speed, Save/Reset */}
      <TopBar
        view={view}
        dispatch={dispatch}
        onSave={saveGameNow}
        onReset={() => resetGame()}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-3 md:p-4 max-w-[1600px] w-full mx-auto flex flex-col gap-3">
        {/* Mobile Navigation Tabs (< lg screens) */}
        <div className="flex lg:hidden bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs">
          <button
            onClick={() => setMobileTab('char')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 font-semibold transition-colors ${
              mobileTab === 'char' ? 'bg-emerald-500 text-black' : 'text-neutral-400'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Chỉ số</span>
          </button>
          <button
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 font-semibold transition-colors ${
              mobileTab === 'map' ? 'bg-emerald-500 text-black' : 'text-neutral-400'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Bản đồ</span>
          </button>
          <button
            onClick={() => setMobileTab('app')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 font-semibold transition-colors ${
              mobileTab === 'app' ? 'bg-emerald-500 text-black' : 'text-neutral-400'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>App Tài Xế</span>
          </button>
          <button
            onClick={() => setMobileTab('logs')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 font-semibold transition-colors ${
              mobileTab === 'logs' ? 'bg-emerald-500 text-black' : 'text-neutral-400'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Nhật ký</span>
          </button>
        </div>

        {/* Desktop 3-Column Layout & Mobile View Toggle */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 items-start">
          {/* Left Column: Character Stats, Skills, Goals, Vehicles */}
          <div className={`lg:col-span-3 ${mobileTab === 'char' ? 'block' : 'hidden lg:block'}`}>
            <CharacterPanel
              view={view}
              dispatch={dispatch}
              onOpenEatModal={() => setIsEatModalOpen(true)}
              onOpenDrinkModal={() => setIsDrinkModalOpen(true)}
              onOpenSleepModal={() => setIsSleepModalOpen(true)}
              onOpenMaintenanceModal={() => setIsMaintenanceModalOpen(true)}
              onOpenSkillsModal={() => setIsSkillsModalOpen(true)}
              onOpenCommunityModal={() => setIsCommunityModalOpen(true)}
              onOpenGoalsModal={() => setIsGoalsModalOpen(true)}
              onOpenVehicleShopModal={() => setIsVehicleShopModalOpen(true)}
            />
          </div>

          {/* Center Column: 2D City Map & Journey */}
          <div className={`lg:col-span-5 ${mobileTab === 'map' ? 'block' : 'hidden lg:block'}`}>
            <CityMap state={state} view={view} dispatch={dispatch} />
          </div>

          {/* Right Column: Driver App Screen */}
          <div className={`lg:col-span-4 ${mobileTab === 'app' ? 'block' : 'hidden lg:block'}`}>
            <DriverAppScreen state={state} view={view} dispatch={dispatch} />
          </div>

          {/* Mobile Logs View */}
          <div className={`lg:hidden ${mobileTab === 'logs' ? 'block' : 'hidden'}`}>
            <EventLogPanel logs={view.logs} />
          </div>
        </div>

        {/* Bottom Panel: Event Log for Desktop */}
        <div className="hidden lg:block">
          <EventLogPanel logs={view.logs} />
        </div>
      </main>

      {/* Interactive Action Modals */}
      <EatModal
        isOpen={isEatModalOpen}
        onClose={() => setIsEatModalOpen(false)}
        cash={state.economy.cash}
        dispatch={dispatch}
      />
      <DrinkModal
        isOpen={isDrinkModalOpen}
        onClose={() => setIsDrinkModalOpen(false)}
        cash={state.economy.cash}
        dispatch={dispatch}
      />
      <SleepModal
        isOpen={isSleepModalOpen}
        onClose={() => setIsSleepModalOpen(false)}
        dispatch={dispatch}
      />
      <MaintenanceModal
        isOpen={isMaintenanceModalOpen}
        vehicle={state.vehicle}
        cash={state.economy.cash}
        onClose={() => setIsMaintenanceModalOpen(false)}
        dispatch={dispatch}
      />

      {/* Milestone 5 Modals */}
      {isSkillsModalOpen && (
        <SkillsModal
          skills={view.skills}
          onClose={() => setIsSkillsModalOpen(false)}
        />
      )}

      {isCommunityModalOpen && (
        <CommunityModal
          messages={view.npcMessages}
          activeCsgtZones={view.activeCsgtZones}
          onClose={() => setIsCommunityModalOpen(false)}
        />
      )}

      {isGoalsModalOpen && (
        <GoalsModal
          goal={view.goal}
          loan={view.loan}
          economy={state.economy}
          onSetGoal={(goalId) => dispatch({ t: 'SET_GOAL', goalId })}
          onContributeGoal={(amount) => dispatch({ t: 'CONTRIBUTE_GOAL', amount })}
          onTakeEmergencyLoan={(amount) => dispatch({ t: 'TAKE_EMERGENCY_LOAN', amount })}
          onRepayLoan={(amount) => dispatch({ t: 'REPAY_LOAN', amount })}
          onClose={() => setIsGoalsModalOpen(false)}
        />
      )}

      {isVehicleShopModalOpen && (
        <VehicleShopModal
          currentVehicle={state.vehicle}
          ownedVehicles={view.ownedVehicles}
          economy={state.economy}
          onBuyVehicle={(vehicleId, paymentMode) => dispatch({ t: 'BUY_VEHICLE', vehicleId, paymentMode })}
          onSwitchVehicle={(vehicleId) => dispatch({ t: 'SWITCH_VEHICLE', vehicleId })}
          onClose={() => setIsVehicleShopModalOpen(false)}
        />
      )}

      {/* Police Fine Modal */}
      {view.activePoliceFine && (
        <PoliceFineModal
          fine={view.activePoliceFine}
          onDismiss={() => dispatch({ t: 'DISMISS_POLICE_FINE' })}
        />
      )}

      {/* Street Events & Accidents Modal */}
      <EventModal
        activeEvent={view.activeEvent}
        activeAccident={view.activeAccident}
        dispatch={dispatch}
      />

      {/* Daily Summary Modal */}
      <DailySummaryModal
        isOpen={view.showDailySummaryModal}
        summary={view.pendingSummary}
        onClose={() => dispatch({ t: 'CLOSE_SUMMARY_MODAL' })}
      />
    </div>
  );
};
export default App;
