import React, { useState } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { TopBar } from './components/TopBar';
import { CharacterPanel } from './components/CharacterPanel';
import { CityMap } from './components/CityMap';
import { DriverAppScreen } from './components/DriverAppScreen';
import { EventLogPanel } from './components/EventLogPanel';
import { EatModal, DrinkModal, SleepModal } from './components/ActionModals';
import { User, Map, Smartphone, Terminal } from 'lucide-react';

export const App: React.FC = () => {
  const { state, view, dispatch } = useGameEngine();

  // Modals state
  const [isEatModalOpen, setIsEatModalOpen] = useState(false);
  const [isDrinkModalOpen, setIsDrinkModalOpen] = useState(false);
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);

  // Mobile active tab
  const [mobileTab, setMobileTab] = useState<'char' | 'map' | 'app' | 'logs'>('char');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Bar with Time, Finances, Speed */}
      <TopBar view={view} dispatch={dispatch} />

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
          {/* Left Column: Character Stats & Vehicle */}
          <div className={`lg:col-span-3 ${mobileTab === 'char' ? 'block' : 'hidden lg:block'}`}>
            <CharacterPanel
              view={view}
              dispatch={dispatch}
              onOpenEatModal={() => setIsEatModalOpen(true)}
              onOpenDrinkModal={() => setIsDrinkModalOpen(true)}
              onOpenSleepModal={() => setIsSleepModalOpen(true)}
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

      {/* Interactive Modals */}
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
    </div>
  );
};
export default App;
