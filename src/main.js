import "drag-drop-touch";
import "./shims";
import { mergeGlobals } from "./merge-globals";
import { watchLatestCommit } from "./commit-watcher";

async function start() {
  await mergeGlobals();
  const { browserCheck, init, showGameUI } = await import("./game");
  if (browserCheck()) init();
  // Dynamic imports may finish after the window's load event has already fired.
  if (document.readyState === "complete") showGameUI();
  else window.addEventListener("load", showGameUI, { once: true });
  watchLatestCommit();
}

start();
