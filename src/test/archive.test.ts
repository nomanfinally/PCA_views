import { expect, it } from "vitest";
import {
  archiveHtml,
  restoreArchiveState,
  serializeArchive,
} from "../domain/archive";
import { initialView, viewReducer } from "../domain/viewState";
import { parseEvec } from "../domain/parseEvec";
it("archives all rows, including hidden populations, overrides, selection and viewport", () => {
  const dataset = parseEvec("a 0 1 A\nb 1 2 B", "test.evec");
  let state = viewReducer(initialView(), {
    type: "population",
    name: "B",
    patch: { hidden: true, hull: true },
  });
  state = viewReducer(state, {
    type: "point",
    key: 0,
    patch: { symbol: "diamond-open", color: "#123456", marked: true },
  });
  state.selected.add(0);
  state.search = "a";
  const viewport = {
    xRange: [-0.1, 0.1],
    yRange: [0.9, 1.1],
    width: 900,
    height: 600,
    offsets: [["0:1:A", { ax: 42, ay: 30 }]] as [
      string,
      { ax: number; ay: number },
    ][],
  };
  const archive = JSON.parse(
    JSON.stringify(serializeArchive(dataset, state, viewport)),
  );
  expect(restoreArchiveState(archive)).toEqual(state);
  expect(archive.dataset.samples).toHaveLength(2);
  expect(archive.viewport).toEqual(viewport);
});
it("injected data cannot terminate its JSON script tag", () => {
  const dataset = parseEvec(
    "a 0 1 </script><script>alert(1)</script>",
    "test.evec",
  );
  const archive = serializeArchive(dataset, initialView(), {
    xRange: [0, 1],
    yRange: [0, 1],
    width: 800,
    height: 600,
    offsets: [],
  });
  const html = archiveHtml(archive, {
    js: "window.loaded=true;",
    css: "body{color:black}",
  });
  const payload = html.match(
    /<script id="pca-archive" type="application\/json">(.*?)<\/script>/s,
  )![1];
  expect(payload).not.toContain("<");
  expect(JSON.parse(payload).dataset.samples[0].population).toBe(
    dataset.samples[0].population,
  );
  expect(html.match(/<script/g)).toHaveLength(2);
});
