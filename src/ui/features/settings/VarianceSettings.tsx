import { parseSpectrum } from "../../../core/parsers/parseSpectrum";
import type { SettingsContext } from "./SettingsContext";

export function VarianceSettings({ context }: { context: SettingsContext }) {
  const { dataset, state, dispatch, spectrumError, setSpectrumError } = context;
  const s = state.settings;
  const patch = (patch: Partial<typeof s>) =>
    dispatch({ type: "settings", patch });
  return (
    <>
      <section>
        <h3>Explained Variance</h3>
        <label className="control-row">
          Display variance on axis titles
          <input
            type="checkbox"
            checked={s.showVariance}
            onChange={(e) => patch({ showVariance: e.target.checked })}
          />
        </label>

        <p className="field-note">
          To show total variance explained, supply the full eigenvalue spectrum
          or its sum.
        </p>

        <label className="file-control control-row">
          Import eigenvalues (.eval)
          <input
            aria-label="Import eigenvalues"
            type="file"
            accept=".eval,.txt"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                setSpectrumError("");
                const text = await file.text();
                const eigenvalues = parseSpectrum(text, dataset);
                dispatch({
                  type: "spectrum",
                  value: eigenvalues,
                  name: file.name,
                });
              } catch (err: any) {
                setSpectrumError(err.message ?? "Unable to parse .eval file");
              }
              e.target.value = "";
            }}
          />
        </label>

        {spectrumError && (
          <p className="field-error" role="alert">
            {spectrumError}
          </p>
        )}

        {state.spectrumName && (
          <p className="field-note">
            Active spectrum: <strong>{state.spectrumName}</strong> (
            {state.spectrum.length} eigenvalues)
          </p>
        )}

        {state.spectrum.length > 0 && (
          <button
            type="button"
            className="button"
            onClick={() =>
              patch({
                varianceTotal: state.spectrum.reduce((a, b) => a + b, 0),
              })
            }
          >
            Use this as the full spectrum
          </button>
        )}

        <label className="control-row">
          Total variance (sum of all eigenvalues)
          <input
            aria-label="Total variance"
            type="number"
            step="any"
            placeholder="Unknown — use loaded PCs"
            value={s.varianceTotal ?? ""}
            onChange={(e) =>
              patch({
                varianceTotal: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </label>
      </section>
    </>
  );
}
