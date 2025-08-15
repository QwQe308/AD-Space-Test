import * as ADNotations from "adnot-beport-small";

import { DEV } from "@/env";
import { devMigrations } from "./dev-migrations";
import { migrations } from "./migrations";

import { deepmergeAll } from "@/utility/deepmerge";

export const BACKUP_SLOT_TYPE = {
  ONLINE: 0,
  OFFLINE: 1,
  RESERVE: 2,
};

// Note: interval is in seconds, and only the first RESERVE slot is ever used. Having intervalStr as a redundant
// prop is necessary because using our TimeSpan formatting functions produces undesirable strings like "1.00 minutes"
export const AutoBackupSlots = [
  {
    id: 1,
    type: BACKUP_SLOT_TYPE.ONLINE,
    intervalStr: () => `${formatInt(1)} minute`,
    interval: 60,
  },
  {
    id: 2,
    type: BACKUP_SLOT_TYPE.ONLINE,
    intervalStr: () => `${formatInt(5)} minutes`,
    interval: 5 * 60,
  },
  {
    id: 3,
    type: BACKUP_SLOT_TYPE.ONLINE,
    intervalStr: () => `${formatInt(20)} minutes`,
    interval: 20 * 60,
  },
  {
    id: 4,
    type: BACKUP_SLOT_TYPE.ONLINE,
    intervalStr: () => `${formatInt(1)} hour`,
    interval: 3600,
  },
  {
    id: 5,
    type: BACKUP_SLOT_TYPE.OFFLINE,
    intervalStr: () => `${formatInt(10)} minutes`,
    interval: 10 * 60,
  },
  {
    id: 6,
    type: BACKUP_SLOT_TYPE.OFFLINE,
    intervalStr: () => `${formatInt(1)} hour`,
    interval: 3600,
  },
  {
    id: 7,
    type: BACKUP_SLOT_TYPE.OFFLINE,
    intervalStr: () => `${formatInt(5)} hours`,
    interval: 5 * 3600,
  },
  {
    id: 8,
    type: BACKUP_SLOT_TYPE.RESERVE,
  },
];

export const GameStorage = {
  currentSlot: 0,
  saves: {
    0: undefined,
    1: undefined,
    2: undefined,
  },
  saved: 0,
  lastSaveTime: Date.now(),
  lastCloudSave: Date.now(),
  offlineEnabled: undefined,
  offlineTicks: undefined,
  lastUpdateOnLoad: 0,
  lastBackupTimes: [],
  oldBackupTimer: 0,
  ignoreBackupTimer: true,

  // Limit offline tick count using two conditions:
  // - Ticks should never be shorter than 33ms (this would allow offline to exploit tick microstructure)
  // - Count should be limited to 1e6 (the options UI doesn't allow for this to be set above this value)
  maxOfflineTicks(simulatedMs, defaultTicks = this.offlineTicks) {
    const tickLimit = Math.clampMax(Math.floor(simulatedMs / 33), 1e6);
    return Math.clampMax(defaultTicks, tickLimit);
  },

  get localStorageKey() {
    return DEV ? "dimensionTestSave" : "dimensionSave";
  },

  backupDataKey(saveSlot, backupSlot) {
    return DEV ? `backupTestSave-${saveSlot}-${backupSlot}` : `backupSave-${saveSlot}-${backupSlot}`;
  },

  backupTimeKey(saveSlot) {
    return DEV ? `backupTestTimes-${saveSlot}` : `backupTimes-${saveSlot}`;
  },

  load() {
    const save = localStorage.getItem(this.localStorageKey);
    const root = GameSaveSerializer.deserialize(save);

    this.loadRoot(root);
    Achievements.updateSteamStatus();
  },

  loadRoot(root) {
    if (root === undefined) {
      this.currentSlot = 0;
      this.loadPlayerObject(Player.defaultStart);
      return;
    }

    if (root.saves === undefined) {
      // Migrate old format
      this.saves = {
        0: root,
        1: undefined,
        2: undefined,
      };
      this.currentSlot = 0;
      this.loadPlayerObject(root);
      this.loadBackupTimes();
      this.backupOfflineSlots();
      this.save(true);
      return;
    }

    this.saves = root.saves;
    this.currentSlot = root.current;
    this.loadPlayerObject(this.saves[this.currentSlot]);
    this.loadBackupTimes();
    this.backupOfflineSlots();
  },

  loadSlot(slot) {
    this.currentSlot = slot;
    // Save current slot to make sure no changes are lost
    this.save(true);
    this.loadPlayerObject(this.saves[slot] ?? Player.defaultStart);
    this.loadBackupTimes();
    this.backupOfflineSlots();
    Tabs.all.find((t) => t.id === player.options.lastOpenTab).show(false);
    Modal.hideAll();
    Cloud.resetTempState();
    GameUI.notify.info("Game loaded");
    Achievements.updateSteamStatus();
  },

  import(saveData, message = undefined) {
    if (tryImportSecret(saveData) || Theme.tryUnlock(saveData)) {
      return;
    }
    const newPlayer = GameSaveSerializer.deserialize(saveData);
    if (this.checkPlayerObject(newPlayer) !== "") {
      Modal.message.show("Could not load the save (format unrecognized or invalid).");
      return;
    }
    this.oldBackupTimer = player.backupTimer;
    Modal.hideAll();
    Quote.clearAll();
    AutomatorBackend.clearEditor();
    this.loadPlayerObject(newPlayer);
    GlyphAppearanceHandler.clearInvalidCosmetics();
    if (player.speedrun?.isActive) Speedrun.setSegmented(true);
    this.save(true);
    Cloud.resetTempState();
    this.resetBackupTimer();

    // This is to fix a very specific exploit: When the game is ending, some tabs get hidden
    // The options tab is the first one of those, which makes the player redirect to the Pelle tab
    // You can doom your reality even if you haven't unlocked infinity yet if you import while the Pelle tab
    // is showing
    Tab.options.subtabs[0].show();
    GameUI.notify.info("Game imported");
    Achievements.updateSteamStatus();
  },

  importAsFile() {
    if (GameEnd.creditsEverClosed) return;
    const reader = new FileReader();
    const text = reader.readAsText(file);
    this.import(text);
  },

  overwriteSlot(slot, saveData) {
    this.saves[slot] = saveData;
    if (slot === this.currentSlot) {
      this.loadPlayerObject(saveData);
    }

    this.save(true);
  },

  // Some minimal save verification; if the save is valid then this returns an empty string, otherwise it returns a
  // a string roughly stating what's wrong with the save. In order for importing to work properly, this must return
  // an empty string.
  checkPlayerObject(save) {
    // Sometimes save is the output of GameSaveSerializer.deserialize, and if that function fails then it will result
    // in the input parameter here being undefined
    if (save === undefined || save === null) return "Save decoding failed (invalid format)";
    // Right now all we do is check for the existence of an antimatter prop, but if we wanted to do further save
    // verification then here's where we'd do it
    if (save.money === undefined && save.antimatter === undefined) return "Save does not have antimatter property";

    if (save.version === undefined || save.version < 25) {
      return "Save is from an earlier version of AD. Import to vanilla first.";
    }

    // Recursively check for any NaN props and add any we find to an array
    const invalidProps = [];
    function checkNaN(obj, path) {
      let hasNaN = false;
      for (const key in obj) {
        const prop = obj[key];
        let thisNaN;
        switch (typeof prop) {
          case "object":
            thisNaN = checkNaN(prop, `${path}.${key}`);
            hasNaN = hasNaN || thisNaN;
            break;
          case "number":
            thisNaN = Number.isNaN(prop);
            hasNaN = hasNaN || thisNaN;
            if (thisNaN) invalidProps.push(`${path}.${key}`);
            break;
          case "string":
            // If we're attempting to import, all NaN entries will still be strings
            thisNaN = prop === "NaN";
            hasNaN = hasNaN || thisNaN;
            if (thisNaN) invalidProps.push(`${path}.${key}`);
            break;
        }
      }
      return hasNaN;
    }
    checkNaN(save, "player");

    if (invalidProps.length === 0) return "";
    return `${quantify("NaN player property", invalidProps.length)} found:
      ${invalidProps.join(", ")}`;
  },

  // A few things in the current game state can prevent saving, which we want to do for all forms of saving
  canSave(ignoreSimulation = false) {
    const isSelectingGlyph = GlyphSelection.active;
    const isSimulating = ui.$viewModel.modal.progressBar !== undefined && !ignoreSimulation;
    const isEnd =
      (GameEnd.endState >= END_STATE_MARKERS.SAVE_DISABLED && !GameEnd.removeAdditionalEnd) ||
      GameEnd.endState >= END_STATE_MARKERS.INTERACTIVITY_DISABLED;
    return !isEnd && !(isSelectingGlyph || isSimulating);
  },

  save(silent = true, manual = false) {
    if (!this.canSave()) return;
    this.lastSaveTime = Date.now();
    GameIntervals.save.restart();
    if (manual && ++this.saved > 99) SecretAchievement(12).unlock();
    const root = {
      current: this.currentSlot,
      saves: this.saves,
    };
    localStorage.setItem(this.localStorageKey, GameSaveSerializer.serialize(root));
    if (!silent) GameUI.notify.info("Game saved");
  },

  // Saves a backup, updates save timers (this is called before nextBackup is updated), and then saves the timers too.
  // When checking offline backups, this call typically resolves during offline progress simulation, so in this case
  // we want to ignore that (which saves the game state pre-simulation). This is because it's messier and less useful
  // to the player if we instead defer the call until after simulation
  saveToBackup(backupSlot, backupTimer) {
    if (!this.canSave(true)) return;
    localStorage.setItem(this.backupDataKey(this.currentSlot, backupSlot), GameSaveSerializer.serialize(player));
    this.lastBackupTimes[backupSlot] = {
      backupTimer,
      date: Date.now(),
    };
    localStorage.setItem(this.backupTimeKey(this.currentSlot), GameSaveSerializer.serialize(this.lastBackupTimes));
  },

  // Does not actually load, but returns an object which is meant to be passed on to loadPlayerObject()
  loadFromBackup(backupSlot) {
    const data = localStorage.getItem(this.backupDataKey(this.currentSlot, backupSlot));
    return GameSaveSerializer.deserialize(data);
  },

  // Check for the amount of time spent offline and perform an immediate backup for the longest applicable slot
  // which has had more than its timer elapse since the last time the game was open and saved
  backupOfflineSlots() {
    const currentTime = Date.now();
    const offlineTimeMs = currentTime - this.lastUpdateOnLoad;
    const offlineSlots = AutoBackupSlots.filter((slot) => slot.type === BACKUP_SLOT_TYPE.OFFLINE).sort(
      (a, b) => b.interval - a.interval
    );
    for (const backupInfo of offlineSlots) {
      if (offlineTimeMs > 1000 * backupInfo.interval) {
        this.saveToBackup(backupInfo.id, player.backupTimer);
        break;
      }
    }
  },

  backupOnlineSlots(slotsToBackup) {
    const currentTime = player.backupTimer;
    for (const slot of slotsToBackup) this.saveToBackup(slot, currentTime);
  },

  // Loads in all the data from previous backup times in localStorage
  loadBackupTimes() {
    this.lastBackupTimes = GameSaveSerializer.deserialize(localStorage.getItem(this.backupTimeKey(this.currentSlot)));
    if (!this.lastBackupTimes) this.lastBackupTimes = {};
    for (const backupInfo of AutoBackupSlots) {
      const key = backupInfo.id;
      if (!this.lastBackupTimes[key]) {
        this.lastBackupTimes[key] = {
          backupTimer: 0,
          date: 0,
        };
      }
    }
  },

  // This is checked in the checkEverySecond game interval. Determining which slots to save has a 800ms grace time to
  // account for delays occurring from the saving operation itself; without this, the timer slips backwards by a second
  // every time it saves
  tryOnlineBackups() {
    const toBackup = [];
    for (const backupInfo of AutoBackupSlots.filter((slot) => slot.type === BACKUP_SLOT_TYPE.ONLINE)) {
      const id = backupInfo.id;
      const timeSinceLast = player.backupTimer - (this.lastBackupTimes[id]?.backupTimer ?? 0);
      if (1000 * backupInfo.interval - timeSinceLast <= 800) toBackup.push(id);
    }
    this.backupOnlineSlots(toBackup);
  },

  // Set the next backup time, but make sure to skip forward an appropriate amount if a load or import happened,
  // since these may cause the backup timer to be significantly behind
  resetBackupTimer() {
    const latestBackupTime = Object.values(this.lastBackupTimes)
      .map((t) => t && t.backupTimer)
      .max();
    player.backupTimer = Math.max(this.oldBackupTimer, player.backupTimer, latestBackupTime.toNumber());
  },

  // Saves the current game state to the first reserve slot it finds
  saveToReserveSlot() {
    const targetSlot = AutoBackupSlots.find((slot) => slot.type === BACKUP_SLOT_TYPE.RESERVE).id;
    this.saveToBackup(targetSlot, player.backupTimer);
  },

  export() {
    copyToClipboard(this.exportModifiedSave());
    GameUI.notify.info("Exported current savefile to your clipboard");
  },

  get exportDateString() {
    const dateObj = new Date();
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth() + 1;
    const d = dateObj.getDate();
    return `${y}-${m}-${d}`;
  },

  exportAsFile() {
    if (!this.canSave()) return;
    player.options.exportedFileCount++;
    this.save(true);
    const saveFileName = player.options.saveFileName ? ` - ${player.options.saveFileName},` : "";
    const save = this.exportModifiedSave();
    download(
      `AD Save, Slot ${GameStorage.currentSlot + 1}${saveFileName} #${player.options.exportedFileCount} \
(${this.exportDateString}).txt`,
      save
    );
    GameUI.notify.info("Successfully downloaded current save file to your computer");
  },

  exportBackupsAsFile() {
    player.options.exportedFileCount++;
    const backupData = {};
    for (const id of AutoBackupSlots.map((slot) => slot.id)) {
      const backup = this.loadFromBackup(id);
      if (backup) backupData[id] = backup;
    }
    backupData.time = GameSaveSerializer.deserialize(localStorage.getItem(this.backupTimeKey(this.currentSlot)));
    download(
      `AD Save Backups, Slot ${GameStorage.currentSlot + 1} #${player.options.exportedFileCount} \
(${this.exportDateString}).txt`,
      GameSaveSerializer.serialize(backupData)
    );
    GameUI.notify.info("Successfully downloaded save file backups to your computer");
  },

  importBackupsFromFile(importText) {
    const backupData = GameSaveSerializer.deserialize(importText);
    localStorage.setItem(this.backupTimeKey(this.currentSlot), GameSaveSerializer.serialize(backupData.time));
    for (const backupKey of Object.keys(backupData)) {
      if (backupKey === "time") continue;
      const id = Number(backupKey);
      const storageKey = this.backupDataKey(this.currentSlot, id);
      localStorage.setItem(storageKey, GameSaveSerializer.serialize(backupData[backupKey]));
      this.backupTimeData[id] = {
        backupTimer: backupData.time[id].backupTimer,
        date: backupData.time[id].date,
      };
    }
    this.resetBackupTimer();
    GameUI.notify.info("Successfully imported save file backups from file");
  },

  // There are a couple props which may need to export with different values, so we handle that here
  exportModifiedSave() {
    // Speedrun segmented is exported as true
    const segmented = player.speedrun.isSegmented;
    Speedrun.setSegmented(true);

    // Serialize the altered data, then restore the old prop values afterwards and return
    const save = GameSaveSerializer.serialize(player);
    Speedrun.setSegmented(segmented);
    return save;
  },

  hardReset() {
    this.loadPlayerObject(Player.defaultStart);
    this.save(true);
    Tab.dimensions.antimatter.show();
    Cloud.resetTempState();
  },

  // eslint-disable-next-line complexity
  loadPlayerObject(playerObject) {
    this.saved = 0;

    const checkString = this.checkPlayerObject(playerObject);
    if (playerObject === Player.defaultStart || checkString !== "") {
      if (DEV && checkString !== "") {
        // eslint-disable-next-line no-console
        console.log(`Savefile was invalid and has been reset - ${checkString}`);
      }
      player = deepmergeAll([{}, Player.defaultStart]);
      player.records.gameCreatedTime = Date.now();
      player.lastUpdate = Date.now();
      if (DEV) {
        devMigrations.setLatestTestVersion(player);
      }
    } else {
      // We want to support importing from versions much older than the newest pre-reality version, but we also want
      // to support in-dev versions so we don't lose access to the large bank of in-dev saves we've accumulated. As
      // a result, we need to be careful with what order we apply the dev/live migrations and the deepmerge with the
      // default player object to fill in missing props.

      // For pre-Reality versions, we additionally need to fire off an event to ensure certain achievements and
      // notifications trigger properly. Missing props are filled in at this step via deepmerge
      const isPreviousVersionSave = playerObject.version < migrations.firstRealityMigration;
      player = migrations.patchPreReality(playerObject);
      if (isPreviousVersionSave) {
        if (DEV) devMigrations.setLatestTestVersion(player);
        EventHub.dispatch(GAME_EVENT.SAVE_CONVERTED_FROM_PREVIOUS_VERSION);
      }

      // All dev migrations are applied in-place, mutating the player object. Note that since we only want to apply dev
      // migrations in a dev environment, this means that test saves may fail to migrate on the live version
      if (DEV && player.options.testVersion !== undefined) {
        devMigrations.patch(player);
      }

      // Post-reality migrations are separated from pre-reality because they need to happen after any dev migrations,
      // which themselves must happen after the deepmerge

      // We do this because the codeis dumb and doesnt redecimalize if we dont for some reason
      // Also, if we do it later i think it fucks up the code down the line somehow
      if (player.version >= 83) {
        const fixGlyph = (glyph) => {
          glyph.level = new Decimal(glyph.level);
          glyph.rawLevel = new Decimal(glyph.rawLevel);
          glyph.strength = new Decimal(glyph.strength);
          // eslint-disable-next-line consistent-return
          return glyph;
        };
        player.celestials.teresa.bestAMSet = player.celestials.teresa.bestAMSet.map((n) => fixGlyph(n));
        player.celestials.v.runGlyphs = player.celestials.v.runGlyphs.map((n) => n.map((g) => fixGlyph(g)));
        player.reality.glyphs.active = player.reality.glyphs.active.map((n) => fixGlyph(n));
        player.reality.glyphs.inventory = player.reality.glyphs.inventory.map((n) => fixGlyph(n));
        for (let i = 0; i < 7; i++) {
          player.reality.glyphs.sets[i].glyphs = player.reality.glyphs.sets[i].glyphs.map((n) => fixGlyph(n));
        }
        player.records.bestReality.RMSet = player.records.bestReality.RMSet?.map((n) => fixGlyph(n));
        player.records.bestReality.RMminSet = player.records.bestReality.RMminSet?.map((n) => fixGlyph(n));
        player.records.bestReality.glyphLevelSet = player.records.bestReality.glyphLevelSet?.map((n) => fixGlyph(n));
        player.records.bestReality.imCapSet = player.records.bestReality.imCapSet?.map((n) => fixGlyph(n));
        player.records.bestReality.laitelaSet = player.records.bestReality.laitelaSet?.map((n) => fixGlyph(n));
        player.records.bestReality.speedSet = player.records.bestReality.speedSet?.map((n) => fixGlyph(n));
      }
      for (const item in player.reality.glyphs.filter.types) {
        player.reality.glyphs.filter.types[item].rarity = new Decimal(player.reality.glyphs.filter.types[item].rarity);
        // eslint-disable-next-line max-len
        // Eplayer.reality.glyphs.filter.types[item].score = new Decimal(player.reality.glyphs.filter.types[item].score);
      }

      if (player.options.breakPlaceHolder && player.version <= 102 && (player.timestudy.maxTheorem.gte(63) || player.realities.gte(1))) {
        const backUpOptions = JSON.stringify(player.options);
        GameStorage.import(
          "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"
        );
        window.rollbackModalInterval = setInterval(() => {
          if (GameUI.initialized) {
            Modal.message.show(
              `Since you bypassed the endgame in last update, your game is rolled back to an offical save pre-TS111.
          (Note that glyph seed is re-randomized for all save in this update)
          Please don't worry about your achievements and secret ones, they are going to be changed. Options are kept.`,
              {},
              3
            );
            clearInterval(window.rollbackModalInterval);
          }
        }, 1000);
        player.options = JSON.parse(backUpOptions);
        player.options.breakPlaceHolder = false
        return;
      }

      player = migrations.patchPostReality(player);
    }

    this.saves[this.currentSlot] = player;
    this.lastUpdateOnLoad = player.lastUpdate;

    if (DEV) {
      guardFromNaNValues(player);
    }

    ui.view.news = player.options.news.enabled;
    ui.view.newUI = player.options.newUI;
    ui.view.tutorialState = player.tutorialState;
    ui.view.tutorialActive = player.tutorialActive;

    ECTimeStudyState.invalidateCachedRequirements();
    recalculateAllGlyphs();
    checkPerkValidity();
    V.updateTotalRunUnlocks();
    Enslaved.boostReality = false;
    GameEnd.additionalEnd = 0;
    Theme.set(Theme.currentName());
    Glyphs.unseen = [];
    Glyphs.unequipped = [];
    Notations.find(player.options.notation).setAsCurrent(true);
    ADNotations.Settings.exponentCommas.min = 10 ** player.options.notationDigits.comma;
    ADNotations.Settings.exponentCommas.max = 10 ** player.options.notationDigits.notation;

    EventHub.dispatch(GAME_EVENT.GAME_LOAD);
    AutomatorBackend.initializeFromSave();
    Lazy.invalidateAll();

    updateAbyssResearchStatus()

    const rawDiff = Date.now() - player.lastUpdate;
    // We set offlineEnabled externally on importing or loading a backup; otherwise this is just a local load
    const simulateOffline = this.offlineEnabled ?? player.options.offlineProgress;
    if (simulateOffline && !Speedrun.isPausedAtStart()) {
      let diff = rawDiff;
      player.speedrun.offlineTimeUsed += diff;
      if (diff > 5 * 60 * 1000 && player.celestials.enslaved.autoStoreReal) {
        diff = Enslaved.autoStoreRealTime(diff);
      }
      if (diff > 10000) {
        // The third parameter is a `fast` parameter that we use to only
        // simulate at most 50 ticks if the player was offline for less
        // than 50 seconds.
        simulateTime(diff / 1000, false, diff < 50 * 1000);
      } else {
        // This is ugly, should fix how we deal with it...
        this.postLoadStuff();
      }
    } else {
      // Try to unlock "Don't you dare sleep" (usually this check only happens
      // during a game tick, which makes the achievement impossible to get
      // with offline progress off)
      if (!Speedrun.isPausedAtStart()) Achievement(35).tryUnlock();
      player.lastUpdate = Date.now();
      this.postLoadStuff();
    }

    // 2-week threshold for showing the catchup modal. We want to show this even if offline progress is disabled
    // because its presence and usefulness is tied to what the player experiences, not the game. setTimeout seems to be
    // the only way to get this to display, as it won't display even if called after init() entirely nor is it getting
    // actively hidden by Modal.hideAll(), so delaying it asynchronously gets past whatever is causing it to not appear.
    // Delay time is relatively long to make it more likely to work on much slower computers.
    if (rawDiff > 1000 * 86400 * 14) {
      if (["S4", "S9"].includes(Theme.current().name)) Theme.set("Normal");
      // Looks like the game takes too long to load so we need to setTimeout else it doesn't check for the notation.
      setTimeout(() => {
        if (Notations.current.isPainful) Notation.mixedScientific.setAsCurrent();
      }, 2500);
      setTimeout(() => Modal.catchup.show(rawDiff), 5000);
    }
  },
  postLoadStuff() {
    // This is called from simulateTime, if that's called; otherwise, it gets called
    // manually above
    GameIntervals.restart();
    GameStorage.ignoreBackupTimer = false;
    Enslaved.nextTickDiff = new Decimal(player.options.updateRate);
    // The condition for this secret achievement is only checked when the player is actively storing real time, either
    // when online or simulating time. When only storing offline, the condition is never actually entered in the
    // gameLoop due to the option technically being false, so we need to check it on-load too.
    if (player.celestials.enslaved.storedReal.gte(24 * 60 * 60 * 1000)) SecretAchievement(46).unlock();
    GameUI.update();

    for (const resource of AlchemyResources.all) {
      resource.before = resource.amount;
    }
  },
};

function download(filename, text) {
  const pom = document.createElement("a");
  pom.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
  pom.setAttribute("download", filename);

  if (document.createEvent) {
    const event = document.createEvent("MouseEvents");
    event.initEvent("click", true, true);
    pom.dispatchEvent(event);
  } else {
    pom.click();
  }
}
