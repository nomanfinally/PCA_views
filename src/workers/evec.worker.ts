import { parseEvec } from "../core/parsers/parseEvec";

self.onmessage = async (event: MessageEvent<File>) => {
  try {
    const text = await event.data.text();
    const dataset = parseEvec(text, event.data.name);
    self.postMessage({ dataset });
  } catch (error) {
    self.postMessage({
      error:
        error instanceof Error ? error.message : "Unable to read this file.",
    });
  }
};
