import type { LoaderVariant } from "./ArcRevealLoader";

export interface LoaderRegistration {
  pathname: string | null;
  variant: LoaderVariant;
  badgeText?: string;
  className?: string;
  greeting?: string;
}

export interface LoaderState {
  entries: Record<string, LoaderRegistration>;
  screen: LoaderRegistration | null;
  phase: "intro" | "waiting" | "exiting" | "idle";
  cycle: number;
  introDuration: number;
}

export type LoaderAction =
  | { type: "register"; id: string; config: LoaderRegistration }
  | { type: "unregister"; id: string }
  | { type: "intro-complete"; cycle: number }
  | { type: "exit-complete"; cycle: number };

export function initialLoaderState(pathname: string | null): LoaderState {
  const homepage = pathname === "/" || /^\/(en|bn|ne)\/?$/.test(pathname || "");
  return {
    entries: {},
    screen: homepage ? { pathname, variant: "default" } : null,
    phase: homepage ? "intro" : "idle",
    cycle: homepage ? 1 : 0,
    introDuration: homepage ? 2000 : 1200,
  };
}

/** A single owner retains the collage until the entire exit has completed. */
export function loaderReducer(
  state: LoaderState,
  action: LoaderAction,
): LoaderState {
  switch (action.type) {
    case "register": {
      const entries = { ...state.entries, [action.id]: action.config };
      if (state.phase === "idle" || state.phase === "exiting") {
        return {
          entries,
          screen: action.config,
          phase: "intro",
          cycle: state.cycle + 1,
          introDuration: 1200,
        };
      }
      return { ...state, entries, screen: action.config };
    }
    case "unregister": {
      if (!state.entries[action.id]) return state;
      const entries = { ...state.entries };
      delete entries[action.id];
      const remaining = Object.values(entries);
      return {
        ...state,
        entries,
        screen: remaining.at(-1) || state.screen,
        phase:
          remaining.length === 0 && state.phase === "waiting"
            ? "exiting"
            : state.phase,
      };
    }
    case "intro-complete":
      if (action.cycle !== state.cycle || state.phase !== "intro") return state;
      return {
        ...state,
        phase: Object.keys(state.entries).length ? "waiting" : "exiting",
      };
    case "exit-complete":
      if (action.cycle !== state.cycle || state.phase !== "exiting")
        return state;
      return { ...state, screen: null, entries: {}, phase: "idle" };
  }
}
