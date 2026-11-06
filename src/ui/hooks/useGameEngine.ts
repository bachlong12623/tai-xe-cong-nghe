import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Action } from '../../sim/types';
import { createGame, step, dispatch, getView, ViewModel } from '../../sim/engine';
import { loadGame, saveGame } from '../../sim/save';

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = loadGame();
    return saved || createGame();
  });

  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  // Handle actions
  const sendAction = useCallback((action: Action) => {
    const nextState = dispatch(stateRef.current, action);
    stateRef.current = nextState;
    setGameState(nextState);
  }, []);

  // Simulation tick loop
  useEffect(() => {
    if (gameState.speed === 0) return;

    // 1 hour game = 90s real at 1x => 1 tick (1 min game) = 90 * 1000 / 60 = 1500ms
    const intervalMs = Math.max(50, 1500 / gameState.speed);

    const timer = setInterval(() => {
      const nextState = step(stateRef.current, 1);
      stateRef.current = nextState;
      setGameState(nextState);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [gameState.speed]);

  // Real-time 12s countdown timer for pending trip offer
  useEffect(() => {
    if (!gameState.app.currentOffer) return;

    const offerTimer = setInterval(() => {
      sendAction({ t: 'TICK_OFFER_COUNTDOWN' });
    }, 1000);

    return () => clearInterval(offerTimer);
  }, [gameState.app.currentOffer, sendAction]);

  // Periodic autosave (every 30 seconds real time)
  useEffect(() => {
    const saveTimer = setInterval(() => {
      saveGame(stateRef.current);
    }, 30000);
    return () => clearInterval(saveTimer);
  }, []);

  const viewModel: ViewModel = getView(gameState);

  return {
    state: gameState,
    view: viewModel,
    dispatch: sendAction,
    saveGameNow: () => saveGame(stateRef.current),
    resetGame: (seed = Date.now()) => {
      const fresh = createGame(seed);
      stateRef.current = fresh;
      setGameState(fresh);
      saveGame(fresh);
    },
  };
}

