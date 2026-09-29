/**
 * Application ViewState Reducer
 *
 * Pure, deterministic state transition engine handling atomic actions.
 */

import { paletteColor } from "../core/color/palettes";
import { defaultSettings, type MarkerSymbol } from "../core/models/settings";
import { shapeSequence } from "../core/style/symbols";
import type { ViewAction } from "./viewActions";
import { initialView, populationDefaults, type ViewState } from "./viewState";

export function viewReducer(state: ViewState, action: ViewAction): ViewState {
  switch (action.type) {
    case "resetView":
      return initialView(action.dataset);

    case "spectrum":
      return {
        ...state,
        spectrum: action.value,
        spectrumName: action.name,
      };

    case "palette": {
      const populations = new Map(state.populations);
      action.names.forEach((name, index) => {
        populations.set(name, {
          ...populations.get(name),
          color: paletteColor(index, action.value),
        });
      });
      return {
        ...state,
        populations,
        settings: { ...state.settings, palette: action.value },
      };
    }

    case "markers": {
      const populations = new Map(state.populations);
      const isHollow = action.value.startsWith("hollow");
      const wasHollow = state.settings.markerPreset.startsWith("hollow");

      action.names.forEach((name, index) => {
        const base = action.value.includes("shapes")
          ? shapeSequence[index % shapeSequence.length]
          : "circle";
        populations.set(name, {
          ...populations.get(name),
          markerPreset: undefined,
          markerTreatment: undefined,
          symbol: (base + (isHollow ? "-open" : "")) as MarkerSymbol,
        });
      });

      const nextSettings = { ...state.settings, markerPreset: action.value };

      if (isHollow && !wasHollow) {
        if (state.settings.outlineWidth === 0.8) {
          nextSettings.outlineWidth = 1.5;
        }
        if (state.settings.outlineMode === "darker") {
          nextSettings.outlineMode = "matching";
        }
      } else if (!isHollow && wasHollow) {
        if (state.settings.outlineWidth === 1.5) {
          nextSettings.outlineWidth = 0.8;
        }
        if (state.settings.outlineMode === "matching") {
          nextSettings.outlineMode = "darker";
        }
      }

      return {
        ...state,
        populations,
        settings: nextSettings,
      };
    }

    case "axes":
      return { ...state, x: action.x, y: action.y, selected: new Set() };

    case "mode":
      return { ...state, mode: action.value };

    case "search":
      return { ...state, search: action.value };

    case "legend":
      return { ...state, legend: !state.legend };

    case "settings": {
      let patch = action.patch;
      if (patch.markerPreset) {
        const isHollow = patch.markerPreset.startsWith("hollow");
        const wasHollow = state.settings.markerPreset.startsWith("hollow");
        if (isHollow && !wasHollow) {
          patch = {
            outlineWidth:
              state.settings.outlineWidth === 0.8
                ? 1.5
                : state.settings.outlineWidth,
            outlineMode:
              state.settings.outlineMode === "darker"
                ? "matching"
                : state.settings.outlineMode,
            ...patch,
          };
        } else if (!isHollow && wasHollow) {
          patch = {
            outlineWidth:
              state.settings.outlineWidth === 1.5
                ? 0.8
                : state.settings.outlineWidth,
            outlineMode:
              state.settings.outlineMode === "matching"
                ? "darker"
                : state.settings.outlineMode,
            ...patch,
          };
        }
      }
      return { ...state, settings: { ...state.settings, ...patch } };
    }

    case "population": {
      const populations = new Map(state.populations);
      populations.set(action.name, {
        ...populations.get(action.name),
        ...action.patch,
      });
      return { ...state, populations };
    }

    case "allPopulations": {
      const populations = new Map(state.populations);
      action.names.forEach((name) => {
        populations.set(name, {
          ...populations.get(name),
          ...action.patch,
        });
      });
      return { ...state, populations };
    }

    case "isolate": {
      const populations = new Map(state.populations);
      action.names.forEach((name) => {
        populations.set(name, {
          ...populations.get(name),
          hidden: name !== action.name,
        });
      });
      return { ...state, populations };
    }

    case "resetPopulation": {
      const populations = new Map(state.populations);
      const hidden = populations.get(action.name)?.hidden;
      const index = state.populationNames.indexOf(action.name);
      populations.set(action.name, {
        ...(index >= 0
          ? populationDefaults(index, state.populationNames.length)
          : {}),
        hidden,
      });
      return { ...state, populations };
    }

    case "toggleMark": {
      const points = new Map(state.points);
      points.set(action.key, {
        ...points.get(action.key),
        marked: !points.get(action.key)?.marked,
      });
      return { ...state, points };
    }

    case "resetPoint": {
      const points = new Map(state.points);
      points.delete(action.key);
      return { ...state, points };
    }

    case "point": {
      const points = new Map(state.points);
      points.set(action.key, {
        ...points.get(action.key),
        ...action.patch,
      });
      return { ...state, points };
    }

    case "inspect": {
      const points = new Map(state.points);
      if (action.key !== null && action.mark) {
        points.set(action.key, {
          ...points.get(action.key),
          marked: true,
        });
      }
      return { ...state, inspector: action.key, points };
    }

    case "select":
      return { ...state, selected: new Set(action.keys) };

    case "markSelection": {
      const points = new Map(state.points);
      state.selected.forEach((key) => {
        points.set(key, { ...points.get(key), marked: action.marked });
      });
      return { ...state, points };
    }

    case "clearMarks":
      return {
        ...state,
        points: new Map(
          [...state.points].map(([key, style]) => [
            key,
            { ...style, marked: false },
          ]),
        ),
        selected: new Set(),
      };

    case "resetAppearance":
      return {
        ...state,
        settings: {
          ...defaultSettings,
          markerPreset: state.populationNames.length > 8 ? "shapes" : "circles",
        },
        populations: new Map(
          (state.populationNames.length
            ? state.populationNames
            : [...state.populations.keys()]
          ).map((name, index) => [
            name,
            {
              ...(state.populationNames.length
                ? populationDefaults(index, state.populationNames.length)
                : {}),
              hidden: state.populations.get(name)?.hidden,
            },
          ]),
        ),
        points: new Map(),
        selected: new Set(),
      };

    case "toggleExcludeSample": {
      const excludedSamples = new Set(state.excludedSamples);
      if (excludedSamples.has(action.key)) {
        excludedSamples.delete(action.key);
      } else {
        excludedSamples.add(action.key);
      }
      return { ...state, excludedSamples };
    }

    case "setSampleExcluded": {
      const excludedSamples = new Set(state.excludedSamples);
      if (action.excluded) {
        excludedSamples.add(action.key);
      } else {
        excludedSamples.delete(action.key);
      }
      return { ...state, excludedSamples };
    }

    case "setMultipleExcluded": {
      const excludedSamples = new Set(state.excludedSamples);
      action.keys.forEach((key) => {
        if (action.excluded) {
          excludedSamples.add(key);
        } else {
          excludedSamples.delete(key);
        }
      });
      return { ...state, excludedSamples };
    }

    case "clearAllExclusions":
      return { ...state, excludedSamples: new Set() };

    case "setSamplePopulation": {
      const targetPop = action.population.trim();
      if (!targetPop) return state;

      const samplePopulations = new Map(state.samplePopulations);
      samplePopulations.set(action.key, targetPop);

      const populations = new Map(state.populations);
      const populationNames = [...state.populationNames];

      if (!populations.has(targetPop)) {
        const index = populationNames.length;
        populationNames.push(targetPop);
        const totalCount = populationNames.length;
        const isHollow = state.settings.markerPreset.startsWith("hollow");
        const shape =
          state.settings.markerPreset.includes("shapes") || totalCount > 8
            ? shapeSequence[index % shapeSequence.length]
            : "circle";
        populations.set(targetPop, {
          color: paletteColor(index, state.settings.palette),
          symbol: (shape + (isHollow ? "-open" : "")) as MarkerSymbol,
        });
      }

      return {
        ...state,
        samplePopulations,
        populationNames,
        populations,
      };
    }

    case "resetSamplePopulation": {
      const samplePopulations = new Map(state.samplePopulations);
      samplePopulations.delete(action.key);
      return { ...state, samplePopulations };
    }

    default:
      return state;
  }
}
