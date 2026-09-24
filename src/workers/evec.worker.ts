import { parseEvec } from "../domain/parseEvec";
self.onmessage = async (event: MessageEvent<File>) => {
  try {
    self.postMessage({
      dataset: parseEvec(await event.data.text(), event.data.name),
    });
  } catch (error) {
    self.postMessage({
      error:
        error instanceof Error ? error.message : "Unable to read this file.",
    });
  }
};
