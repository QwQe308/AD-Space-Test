import { DC } from "../../constants";

let swapDelay = 1000;

function waitForInterval() {
  return new Promise((resolve) => {
    setTimeout(() => {
      Quote.advanceQueue();
      resolve();
    }, swapDelay);
  });
}

function showText(info) {
  return new Promise((resolve) => {
    setTimeout(() => {
      ui.view.abyssTexts += info[0];
      if (info.length == 3) info[2]();
      resolve();
    }, info[1]);
  });
}

let abyssTexts = [
  [
    "<br>FATAL ERROR: JavaScript heap out of memory",
    4000,
    () => {
      console.error("FATAL ERROR: JavaScript heap out of memory");
    },
  ],
  ["<br>.", 1000],
  [".", 800],
  [".", 600],
  [".", 500],
  [".", 400],
  [".", 300],
  [".", 200],
  [".", 150],
  [".", 140],
  [".", 130],
  [".", 120],
  [".", 100],
  ["<br>Attempting to reboot", 1000],
  [".", 800],
  [".", 500],
  [".", 500],
  [".", 1000],
  [".", 800],
  [".", 1000],
  ["<br>Antimatter.exe successfully booted in 1083ms", 1083],
  ["<br>Dimension_Boost.exe successfully booted in 512ms", 512],
  ["<br>Galaxy.exe successfully booted in 42ms", 42],
  ["<br>Big_Crunch.exe successfully booted in 31ms", 31],
  ["<br>Infinity_Upgrades.exe successfully booted in 62ms", 62],
  ["<br>Break_Infinity.exe successfully booted in 32ms", 32],
  ["<br>Challenges.exe successfully booted in 84ms", 84],
  ["<br>Options.exe successfully booted in 51ms", 51],
  ["<br>Autobuyers.exe successfully booted in 213ms", 213],
  ["<br>Automator.exe successfully booted in 1157ms", 1157],
  ["<br>Space.exe successfully booted in 46ms", 46],
  ["<br>Statistics.exe successfully booted in 67ms", 67],
  ["<br>Dimensions.exe successfully booted in 40ms", 40],
  ["<br>Continuum.exe successfully booted in 12ms", 12],
  ["<br>Eternity.exe successfully booted in 98ms", 98],
  ["<br>Eternity_Milestones.exe successfully booted in 216ms", 216],
  ["<br>Tickspeed.exe successfully booted in 220ms", 220],
  ["<br>Eternity_Upgrades.exe successfully booted in 44ms", 44],
  ["<br>Mirror.exe successfully booted in 1904ms", 1904],
  ["<br>Space.exe successfully booted in 1351ms", 1351],
  ["<br>! Error detected in booting Space_Research.exe !", 41],
  ["<br>! Error detected in booting Achievements.exe !", 53],
  ["<br>! Error detected in booting Time_Studies.exe !", 53],
  ["<br>.", 800],
  [".", 500],
  [".", 500],
  [".", 1000],
  [".", 800],
  [".", 1000],
  ["<br>! Booting System Failed !", 2253],
  ["<br>.", 800],
  [".", 500],
  [".", 500],
  [".", 1000],
  [".", 800],
  [".", 1000],
  [".", 500],
  [".", 500],
  ["<br>Catching errors...", 800],
  [".", 1000],
  [".", 800],
  [".", 1000],
  [".", 500],
  [".", 500],
  ["<br>! Imaginary Influence Detected !", 500],
  ["<br>Searching for solutions...", 800],
  [".", 600],
  [".", 800],
  [".", 500],
  [".", 700],
  [".", 500],
  ["<br>Safety System successfully booted. Starting Plan Alpha...", 1000],
  [".", 1000],
  [".", 800],
  [".", 700],
  [".", 600],
  [".", 500],
  [
    "",
    1000,
    () => {
      ui.view.abyssTexts = "";
    },
  ], //clear all texts, they are going to get off-screen
  ["<br>Influence_Analyzer.exe successfully imported.", 2500],
  ["<br>Analyzing.", 2500],
  [".", 1000],
  [".", 800],
  [".", 700],
  [".", 600],
  [".", 500],
  [".", 500],
  [".", 600],
  [".", 700],
  [".", 500],
  ["<br>Imaginary Influence Source detected: Abyss. (Influence stat: 50 - HIGH)", 3000],
  ["<br>Warning: Some data is permanently lost. Things could go strange.", 2000],
  ["<br>Trying to boot in safety mode.", 2000],
  [".", 1000],
  [".", 800],
  [".", 1000],
  [".", 500],
  [".", 500],
  ["<br>Please refresh the page. Antimatter Dimensions Eternal.", 2000],
];

export async function abyssAnimation() {
  EventHub.dispatch(GAME_EVENT.ABYSS_ANIMATION_BEFORE);
  for (let i in Quotes) {
    Quotes[i].all.forEach((element) => {
      element.present();
    });
  }
  while (ui.view.quotes.current) {
    if (swapDelay > 250) swapDelay /= 1.06;
    swapDelay /= 1.04;
    await waitForInterval();
  }
  GameIntervals.stop(); //pauses the game
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 5000);
  });
  swapDelay = 1000;
  ui.view.abyssTexts = "";
  Modal.abyssOverlay.show();
  GameIntervals.start(); //resumes the game
  for (let i = 0; i < abyssTexts.length; i++) {
    await showText(abyssTexts[i]);
  }
  for (const autobuyer of Autobuyers.unlocked) {
    autobuyer.isActive = false;
  }
  Laitela.setContinuum(false);
  //reset values
  for (let i = 0; i < player.achievementBits.length; i++) {
    player.achievementBits[i] = 0;
  }
  eternity(true, true);
  player.eternityPoints = new Decimal(0);
  fullResetTimeDimensions();
  player.eternities = new Decimal(0);
  respecTimeStudies(true);
  player.timestudy.theorem = new Decimal(0);
  TimeTheoremPurchaseType.am.reset();
  TimeTheoremPurchaseType.ip.reset();
  TimeTheoremPurchaseType.ep.reset();
  resetEternityRuns();
  player.records.thisEternity.time = DC.D0;
  player.records.thisEternity.realTime = DC.D0;
  player.records.bestEternity.time = DC.BEMAX;
  player.records.bestEternity.realTime = DC.BEMAX;
  player.eternityUpgrades.clear();
  player.totalTickGained = DC.D0;
  player.eternityChalls = {};
  player.challenge.eternity.current = 0;
  player.challenge.eternity.unlocked = 0;
  player.challenge.eternity.requirementBits = 0;
  SpaceResearchTierDetail[4].forEach((x) => SpaceResearchRifts[x].reset());
  player.imaginaryInfluence.push("abyss");
  eternity(true, true);
  player.eternities = new Decimal(100);
  player.abyssResearches.A1.unlocked = true;
  player.abyssResearches.A1.shown = true;
  player.infinityUpgrades = new Set();
  player.replicanti.unl = false;
  bigCrunchReset(true)
  player.amProc = DC.D0
  player.space = DC.D0
  player.records.thisReality.maxSpace = DC.D0
  //end
  AutomatorBackend.pause();
  Tab.imaginary.analyzer.show(false, true);
  for (const tab of Tabs.currentUIFormat) if (!tab.isHidden) tab.toggleVisibility();
  GameStorage.save(true);
  GameIntervals.stop();
  //EventHub.dispatch(GAME_EVENT.ABYSS_ANIMATION_AFTER); //no after lol
}
