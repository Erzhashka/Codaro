import { useMemo, useState } from "react";
import { NICHE_MODE_CONFIGS } from "../config/niches";
import type { NicheMode, NicheModeConfig } from "../types";

type UseCommunityState = {
  activeMode: NicheMode;
  availableModes: NicheMode[];
  activeConfig: NicheModeConfig;
  switchMode: (nextMode: NicheMode) => void;
};

export function useCommunity(initialMode: NicheMode = "focus"): UseCommunityState {
  const [activeMode, setActiveMode] = useState<NicheMode>(initialMode);

  const activeConfig = useMemo(() => {
    return NICHE_MODE_CONFIGS[activeMode];
  }, [activeMode]);

  const availableModes = useMemo(() => {
    return Object.keys(NICHE_MODE_CONFIGS) as NicheMode[];
  }, []);

  const switchMode = (nextMode: NicheMode) => {
    setActiveMode(nextMode);
  };

  return {
    activeMode,
    availableModes,
    activeConfig,
    switchMode,
  };
}