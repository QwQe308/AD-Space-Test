function mergeIntoGlobal(object) {
  for (const key in object) {
    if (key === "default") {
      // Skip default exports
      continue;
    }
    const value = object[key];
    const existingValue = window[key];
    if (existingValue !== undefined) {
      throw `Property ${key} already exists in global context`;
    }

    window[key] = value;
  }
}

export async function mergeGlobals() {
  // Native ES modules evaluate static imports before this module's body. Load each
  // stage only after the globals needed by the next stage have been installed.
  mergeIntoGlobal(await import("./core/utils"));
  mergeIntoGlobal(await import("./core/secret-formula"));

  // Legacy component globals; do not add new globals to component files.
  mergeIntoGlobal(await import("@/components/tabs/automator/AutomatorBlockEditor"));
  mergeIntoGlobal(await import("@/components/tabs/automator/AutomatorBlocks"));
  mergeIntoGlobal(await import("@/components/tabs/automator/AutomatorTextEditor"));
  mergeIntoGlobal(await import("@/components/tabs/perks/PerksTab"));

  mergeIntoGlobal(await import("./core/globals"));
  mergeIntoGlobal(await import("./game"));
}
