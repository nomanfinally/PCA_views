import { useMemo } from "react";
import type { Dataset } from "../../core/models/dataset";
import { filteredSamples } from "../../state/viewSelectors";
import type { ViewState } from "../../state/viewState";

export function useVisibleSamples(dataset: Dataset, state: ViewState) {
  // Style changes keep the visibility key stable; inspecting/marking does not
  // allocate another sample array or invalidate the plot specification.
  const visibilityKey = JSON.stringify(
    [...state.populations]
      .filter(([, style]) => style.hidden)
      .map(([name]) => name)
      .sort(),
  );
  return useMemo(
    () => filteredSamples(dataset, state),
    [dataset, state.search, state.excludedSamples, visibilityKey],
  );
}
