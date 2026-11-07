(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // js/player-data-store.js
  var STORAGE_KEY = "emergencyEngineer:player-data:v1";
  var DEFAULTS = {
    profile: { educationLevel: "unspecified" },
    settings: { language: "ar", soundEnabled: true, musicEnabled: false },
    notes: [],
    events: [],
    studiedConcepts: []
  };
  var memoryStore = /* @__PURE__ */ new Map();
  function getStorageItem(key) {
    if (typeof localStorage !== "undefined") return localStorage.getItem(key);
    return memoryStore.get(key) ?? null;
  }
  function setStorageItem(key, val) {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, val);
    } else {
      memoryStore.set(key, val);
    }
  }
  function read() {
    try {
      const value = JSON.parse(getStorageItem(STORAGE_KEY) || "null") ?? {};
      return {
        ...DEFAULTS,
        ...value,
        profile: { ...DEFAULTS.profile, ...value.profile ?? {} },
        settings: { ...DEFAULTS.settings, ...value.settings ?? {} },
        notes: Array.isArray(value.notes) ? value.notes : [],
        events: Array.isArray(value.events) ? value.events : [],
        studiedConcepts: Array.isArray(value.studiedConcepts) ? value.studiedConcepts : []
      };
    } catch (error) {
      console.warn("[player-data-store] Could not read player data:", error);
      return {
        profile: { ...DEFAULTS.profile },
        settings: { ...DEFAULTS.settings },
        notes: [],
        events: [],
        studiedConcepts: []
      };
    }
  }
  function write(data) {
    try {
      setStorageItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.warn("[player-data-store] Could not save player data:", error);
      return false;
    }
  }
  function getSettings() {
    return read().settings;
  }
  function updateSettings(patch) {
    const data = read();
    data.settings = { ...data.settings, ...patch };
    write(data);
    return data.settings;
  }
  function getProfile() {
    return read().profile;
  }
  function updateProfile(patch) {
    const data = read();
    data.profile = { ...data.profile, ...patch };
    write(data);
    return data.profile;
  }
  function getNotes() {
    return read().notes;
  }
  function saveNote(note) {
    const data = read();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (note.id) {
      data.notes = data.notes.map((item) => item.id === note.id ? { ...item, ...note, updatedAt: now } : item);
    } else {
      data.notes.unshift({ ...note, id: createId(), createdAt: now, updatedAt: now });
    }
    write(data);
    return data.notes;
  }
  function deleteNote(id) {
    const data = read();
    data.notes = data.notes.filter((note) => note.id !== id);
    write(data);
    return data.notes;
  }
  function getEvents() {
    return read().events;
  }
  function recordStageEvent(event) {
    const data = read();
    data.events.unshift({ ...event, id: createId(), createdAt: (/* @__PURE__ */ new Date()).toISOString() });
    data.events = data.events.slice(0, 100);
    write(data);
    return data.events;
  }
  function getStudiedConcepts() {
    return read().studiedConcepts;
  }
  function markConceptStudied(conceptId) {
    const data = read();
    if (!data.studiedConcepts.includes(conceptId)) data.studiedConcepts.push(conceptId);
    write(data);
    return data.studiedConcepts;
  }
  function createId() {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  // js/i18n.js
  var STRINGS = {
    ar: {
      appName: "\u0645\u0647\u0646\u062F\u0633 \u0627\u0644\u0637\u0648\u0627\u0631\u0626",
      start: "\u0627\u0628\u062F\u0623 \u0627\u0644\u0644\u0639\u0628",
      play: "\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0645\u0631\u062D\u0644\u0629",
      about: "\u0646\u0628\u0630\u0629 \u0639\u0646 \u0627\u0644\u0644\u0639\u0628\u0629",
      continue: "\u0645\u062A\u0627\u0628\u0639\u0629",
      back: "\u0631\u062C\u0648\u0639",
      save: "\u062D\u0641\u0638",
      cancel: "\u0625\u0644\u063A\u0627\u0621",
      close: "\u0625\u063A\u0644\u0627\u0642",
      welcome: "\u0645\u0631\u062D\u0628\u064B\u0627 \u0628\u0643",
      welcomeText: "\u062A\u062F\u0631\u0651\u0628 \u0639\u0644\u0649 \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062A\u060C \u0648\u0641\u0647\u0645 \u0627\u0644\u0623\u062F\u0644\u0629\u060C \u0648\u0627\u062A\u062E\u0627\u0630 \u0642\u0631\u0627\u0631 \u0647\u0646\u062F\u0633\u064A \u0645\u0633\u0624\u0648\u0644.",
      playerName: "\u0627\u0633\u0645 \u0627\u0644\u0637\u0627\u0644\u0628",
      educationLevel: "\u0627\u0644\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u062F\u0631\u0627\u0633\u064A",
      chooseLevel: "\u0627\u062E\u062A\u0631 \u0645\u0633\u062A\u0648\u0627\u0643 \u0627\u0644\u062F\u0631\u0627\u0633\u064A (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)",
      levelUnspecified: "\u0623\u0641\u0636\u0644 \u0639\u062F\u0645 \u0627\u0644\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0622\u0646",
      levelYear1: "\u0627\u0644\u0633\u0646\u0629 \u0627\u0644\u0623\u0648\u0644\u0649",
      levelYear2: "\u0627\u0644\u0633\u0646\u0629 \u0627\u0644\u062B\u0627\u0646\u064A\u0629",
      levelYear3: "\u0627\u0644\u0633\u0646\u0629 \u0627\u0644\u062B\u0627\u0644\u062B\u0629",
      levelMaster: "\u0645\u0627\u0633\u062A\u0631 / \u0645\u062A\u0642\u062F\u0645",
      aboutTitle: "\u0643\u064A\u0641 \u062A\u0639\u0645\u0644 \u0627\u0644\u0644\u0639\u0628\u0629\u061F",
      aboutBody: "\u0643\u0644 \u0645\u0631\u062D\u0644\u0629 \u0645\u0647\u0645\u0629 \u0647\u0646\u062F\u0633\u064A\u0629. \u0627\u0642\u0631\u0623 \u0627\u0644\u062D\u0627\u0644\u0629\u060C \u062D\u0644\u0644 \u0627\u0644\u0642\u064A\u0627\u0633\u0627\u062A\u060C \u0627\u062E\u062A\u0631 \u0627\u0644\u0642\u0631\u0627\u0631\u060C \u062B\u0645 \u0628\u0631\u0631\u0647. \u0627\u0644\u0623\u062E\u0637\u0627\u0621 \u062A\u062E\u0641\u0636 \u0635\u062D\u0629 \u0627\u0644\u0646\u0638\u0627\u0645 \u0648\u062A\u0638\u0647\u0631 \u0645\u0639\u0647\u0627 \u0645\u0644\u0627\u062D\u0638\u0627\u062A \u062A\u0639\u0644\u064A\u0645\u064A\u0629\u061B \u0623\u0645\u0627 \u0627\u0644\u0646\u0642\u0627\u0637 \u0641\u062A\u064F\u062D\u0633\u0628 \u0648\u0641\u0642 \u0646\u0638\u0627\u0645 \u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062D\u0627\u0644\u064A.",
      aboutProgress: "\u064A\u0641\u062A\u062D \u0627\u0644\u0646\u062C\u0627\u062D \u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629. \u064A\u0645\u0643\u0646\u0643 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0648\u0645\u0631\u0627\u062C\u0639\u0629 \u0623\u0641\u0636\u0644 \u0646\u062A\u064A\u062C\u0629.",
      aboutTools: "\u0627\u0644\u0623\u062F\u0648\u0627\u062A \u0648\u0627\u0644\u0645\u0639\u0637\u064A\u0627\u062A \u062A\u0633\u0627\u0639\u062F \u0639\u0644\u0649 \u0627\u0644\u062A\u062D\u0644\u064A\u0644\u061B \u0627\u0644\u062E\u0631\u064A\u0637\u0629 \u062A\u0645\u062B\u064A\u0644 \u0628\u0635\u0631\u064A \u0644\u0644\u0634\u0628\u0643\u0629 \u0648\u0644\u064A\u0633\u062A \u0645\u062D\u0627\u0643\u0627\u0629 \u062A\u062F\u0641\u0642 \u0641\u0639\u0644\u064A\u0629.",
      skipIntro: "\u062A\u062E\u0637\u064A \u0627\u0644\u0634\u0631\u062D",
      overview: "\u0645\u0631\u0643\u0632 \u0627\u0644\u0642\u064A\u0627\u062F\u0629",
      stages: "\u0627\u0644\u0645\u0631\u0627\u062D\u0644",
      notebook: "\u062F\u0641\u062A\u0631 \u0627\u0644\u0645\u0647\u0646\u062F\u0633",
      eventLog: "\u0633\u062C\u0644 \u0627\u0644\u0623\u062D\u062F\u0627\u062B",
      tools: "\u0627\u0644\u0623\u062F\u0648\u0627\u062A \u0648\u0627\u0644\u0645\u0639\u0631\u0641\u0629",
      achievements: "\u0627\u0644\u0625\u0646\u062C\u0627\u0632\u0627\u062A",
      settings: "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
      profile: "\u0645\u0644\u0641 \u0627\u0644\u0644\u0627\u0639\u0628",
      completed: "\u0627\u0644\u0645\u0631\u0627\u062D\u0644 \u0627\u0644\u0645\u0643\u062A\u0645\u0644\u0629",
      bestScore: "\u0623\u0641\u0636\u0644 \u0646\u062A\u064A\u062C\u0629",
      averageScore: "\u0645\u062A\u0648\u0633\u0637 \u0627\u0644\u0646\u062A\u0627\u0626\u062C",
      correctAnswers: "\u0625\u062C\u0627\u0628\u0627\u062A \u0635\u062D\u064A\u062D\u0629",
      errors: "\u0627\u0644\u0623\u062E\u0637\u0627\u0621",
      timePlayed: "\u0648\u0642\u062A \u0627\u0644\u0644\u0639\u0628 \u0627\u0644\u0645\u0633\u062C\u0644",
      rank: "\u0627\u0644\u0631\u062A\u0628\u0629 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629",
      addNote: "\u0623\u0636\u0641 \u0645\u0644\u0627\u062D\u0638\u0629",
      noteTitle: "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629",
      noteBody: "\u0627\u0643\u062A\u0628 \u0645\u0627 \u062A\u0639\u0644\u0645\u062A\u0647 \u0623\u0648 \u0645\u0627 \u062A\u0631\u064A\u062F \u0645\u0631\u0627\u062C\u0639\u062A\u0647",
      edit: "\u062A\u0639\u062F\u064A\u0644",
      delete: "\u062D\u0630\u0641",
      noNotes: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0628\u0639\u062F.",
      noEvents: "\u0633\u064A\u0638\u0647\u0631 \u0647\u0646\u0627 \u0633\u062C\u0644 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0627\u0644\u0645\u0647\u0645\u0629.",
      noTools: "\u0623\u0643\u0645\u0644 \u0627\u0644\u0645\u0631\u0627\u062D\u0644 \u0644\u0627\u0643\u062A\u0634\u0627\u0641 \u0627\u0644\u0645\u0641\u0627\u0647\u064A\u0645.",
      language: "\u0627\u0644\u0644\u063A\u0629",
      arabic: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
      english: "English",
      sound: "\u0627\u0644\u0645\u0624\u062B\u0631\u0627\u062A \u0627\u0644\u0635\u0648\u062A\u064A\u0629",
      music: "\u0627\u0644\u0645\u0648\u0633\u064A\u0642\u0649",
      on: "\u062A\u0634\u063A\u064A\u0644",
      off: "\u0625\u064A\u0642\u0627\u0641",
      menu: "\u0627\u0644\u0642\u0627\u0626\u0645\u0629",
      currentStage: "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629",
      progress: "\u0627\u0644\u062A\u0642\u062F\u0645",
      timeRemaining: "\u0627\u0644\u0648\u0642\u062A \u0627\u0644\u0645\u062A\u0628\u0642\u064A",
      unlocked: "\u0645\u0641\u062A\u0648\u062D\u0629",
      locked: "\u0645\u0642\u0641\u0644\u0629",
      done: "\u0645\u0643\u062A\u0645\u0644\u0629",
      stage: "\u0627\u0644\u0645\u0631\u062D\u0644\u0629",
      prerequisites: "\u0645\u0639\u0631\u0641\u0629 \u062A\u0633\u0627\u0639\u062F\u0643 \u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u0645\u0631\u062D\u0644\u0629",
      studyFirst: "\u062A\u0639\u0631\u0651\u0641 \u0639\u0644\u0649 \u0627\u0644\u0645\u0641\u0647\u0648\u0645 \u062B\u0645 \u062A\u0627\u0628\u0639\u060C \u0623\u0648 \u0627\u0628\u062F\u0623 \u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0622\u0646.",
      studyAndContinue: "\u0627\u062F\u0631\u0633 \u0648\u062A\u0627\u0628\u0639",
      startAnyway: "\u0627\u0628\u062F\u0623 \u062F\u0648\u0646 \u0627\u0644\u062F\u0631\u0627\u0633\u0629 \u0627\u0644\u0622\u0646",
      studied: "\u062A\u0645\u062A \u0645\u0631\u0627\u062C\u0639\u0629 \u0647\u0630\u0627 \u0627\u0644\u0645\u0641\u0647\u0648\u0645",
      learningLevel: "\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0645\u0631\u062D\u0644\u0629",
      difficulty: "\u0627\u0644\u0635\u0639\u0648\u0628\u0629",
      concepts: "\u0627\u0644\u0645\u0641\u0627\u0647\u064A\u0645",
      outcome: "\u0645\u0627 \u0633\u062A\u062A\u0639\u0644\u0645\u0647",
      success: "\u0625\u062C\u0627\u0628\u0629 \u0635\u062D\u064A\u062D\u0629",
      wrong: "\u0625\u062C\u0627\u0628\u0629 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629",
      earned: "\u0623\u062D\u0633\u0646\u062A\u060C \u0648\u0627\u0635\u0644 \u0627\u0644\u062A\u062D\u0644\u064A\u0644.",
      missed: "\u0631\u0627\u062C\u0639 \u0627\u0644\u062F\u0644\u064A\u0644 \u0648\u0627\u0644\u0634\u0631\u062D \u062B\u0645 \u062D\u0627\u0648\u0644 \u0645\u062C\u062F\u062F\u064B\u0627.",
      closeToast: "\u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u062A\u0646\u0628\u064A\u0647",
      zoomIn: "\u062A\u0643\u0628\u064A\u0631 \u0627\u0644\u062E\u0631\u064A\u0637\u0629",
      zoomOut: "\u062A\u0635\u063A\u064A\u0631 \u0627\u0644\u062E\u0631\u064A\u0637\u0629",
      resetMap: "\u0625\u0639\u0627\u062F\u0629 \u0636\u0628\u0637 \u0627\u0644\u062E\u0631\u064A\u0637\u0629",
      stageCompleted: "\u062A\u0645 \u0625\u0643\u0645\u0627\u0644 \u0627\u0644\u0645\u0631\u062D\u0644\u0629",
      stageFailed: "\u0627\u0646\u062A\u0647\u062A \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629",
      stageUnlocked: "\u062A\u0645 \u0641\u062A\u062D \u0645\u0631\u062D\u0644\u0629 \u062C\u062F\u064A\u062F\u0629",
      firstMission: "\u0623\u0648\u0644 \u0645\u0647\u0645\u0629",
      fiveMissions: "\u0645\u062D\u0644\u0644 \u0647\u064A\u062F\u0631\u0648\u0644\u064A\u0643\u064A",
      noMistakes: "\u0645\u0647\u0646\u062F\u0633 \u062F\u0642\u064A\u0642",
      finalMission: "\u0645\u0647\u0646\u062F\u0633 \u0627\u0644\u0637\u0648\u0627\u0631\u0626",
      noPrerequisiteBlock: "\u0627\u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0644\u0644\u062A\u0639\u0644\u0645 \u0648\u0644\u064A\u0633\u062A \u0642\u0641\u0644\u064B\u0627\u061B \u064A\u0645\u0643\u0646\u0643 \u0628\u062F\u0621 \u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0641\u064A \u0623\u064A \u0648\u0642\u062A.",
      completedCount: "\u0639\u062F\u062F \u0627\u0644\u0645\u0631\u0627\u062D\u0644 \u0627\u0644\u0645\u0643\u062A\u0645\u0644\u0629",
      elapsed: "\u0627\u0644\u0645\u062F\u0629",
      score: "\u0627\u0644\u0646\u062A\u064A\u062C\u0629",
      health: "\u0635\u062D\u0629 \u0627\u0644\u0646\u0638\u0627\u0645",
      budget: "\u0627\u0644\u0645\u064A\u0632\u0627\u0646\u064A\u0629",
      rankMasterEngineer: "\u0645\u0647\u0646\u062F\u0633 \u0623\u0639\u0644\u0649",
      rankSeniorEngineer: "\u0645\u0647\u0646\u062F\u0633 \u0623\u0648\u0644",
      rankHydraulicEngineer: "\u0645\u0647\u0646\u062F\u0633 \u0647\u064A\u062F\u0631\u0648\u0644\u064A\u0643",
      rankJuniorEngineer: "\u0645\u0647\u0646\u062F\u0633 \u0645\u0628\u062A\u062F\u0626",
      rankTrainingRequired: "\u064A\u062D\u062A\u0627\u062C \u062A\u062F\u0631\u064A\u0628\u064B\u0627 \u0625\u0636\u0627\u0641\u064A\u064B\u0627",
      arabicStageNotice: "\u0628\u0639\u0636 \u0646\u0635\u0648\u0635 \u0647\u0630\u0647 \u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0645\u062A\u0627\u062D\u0629 \u0628\u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u062D\u0627\u0644\u064A\u064B\u0627.",
      difficultyBeginner: "\u0645\u0628\u062A\u062F\u0626",
      difficultyIntermediate: "\u0645\u062A\u0648\u0633\u0637",
      difficultyAdvanced: "\u0645\u062A\u0642\u062F\u0645",
      difficultyExpert: "\u062E\u0628\u064A\u0631",
      noObjective: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0647\u062F\u0641 \u0644\u0647\u0630\u0647 \u0627\u0644\u0645\u0631\u062D\u0644\u0629.",
      unsupportedObjective: "\u0646\u0648\u0639 \u0627\u0644\u0647\u062F\u0641 \u063A\u064A\u0631 \u0645\u062F\u0639\u0648\u0645 \u0628\u0639\u062F \u0641\u064A \u0627\u0644\u0648\u0627\u062C\u0647\u0629.",
      chooseOption: "\u0627\u062E\u062A\u0631 \u0627\u0644\u062E\u064A\u0627\u0631 \u0627\u0644\u0645\u0646\u0627\u0633\u0628",
      chooseMultiple: "\u062D\u062F\u062F \u0643\u0644 \u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629",
      submitOptions: "\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A",
      enterCalculation: "\u0623\u062F\u062E\u0644 \u0646\u062A\u064A\u062C\u0629 \u0627\u0644\u062D\u0633\u0627\u0628",
      valuePlaceholder: "\u0627\u0644\u0642\u064A\u0645\u0629",
      confirm: "\u062A\u0623\u0643\u064A\u062F",
      diagnose: "\u0634\u062E\u0651\u0635 \u0627\u0644\u0645\u0634\u0643\u0644\u0629",
      hint: "\u062A\u0644\u0645\u064A\u062D",
      continueStep: "\u0627\u0646\u062A\u0642\u0644 \u0625\u0644\u0649 \u0627\u0644\u062C\u0632\u0621",
      completedStep: "\u0627\u0643\u062A\u0645\u0644 \u0627\u0644\u062C\u0632\u0621",
      justificationExcellent: "\u062A\u0628\u0631\u064A\u0631 \u0645\u0645\u062A\u0627\u0632 \u2014 \u062D\u062F\u062F\u062A \u0643\u0644 \u0627\u0644\u0639\u0648\u0627\u0645\u0644 \u0627\u0644\u0635\u062D\u064A\u062D\u0629 \u0628\u062F\u0648\u0646 \u0623\u064A \u0639\u0627\u0645\u0644 \u063A\u064A\u0631 \u0645\u0646\u0627\u0633\u0628.",
      selectedPipe: "\u0623\u0646\u0628\u0648\u0628 \u0645\u062D\u062F\u064E\u0651\u062F",
      selectedNode: "\u0639\u0642\u062F\u0629 \u0645\u062D\u062F\u064E\u0651\u062F\u0629",
      part: "\u0627\u0644\u062C\u0632\u0621",
      diagnosticStep: "\u062E\u0637\u0648\u0629 \u0627\u0644\u062A\u0634\u062E\u064A\u0635",
      investigationSummary: "\u0645\u0644\u062E\u0635 \u0645\u0627 \u062C\u0645\u0639\u062A\u0647 \u0641\u064A \u0627\u0644\u062A\u062D\u0642\u064A\u0642",
      choicesMatchEvidence: "\u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A \u0645\u062A\u0648\u0627\u0641\u0642\u0629 \u0645\u0639 \u0627\u0644\u0645\u0639\u0637\u064A\u0627\u062A",
      choicesNeedReview: "\u062A\u0648\u062C\u062F \u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A \u0646\u0627\u0642\u0635\u0629 \u0623\u0648 \u062A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0645\u0631\u0627\u062C\u0639\u0629",
      summaryNote: "\u0627\u0633\u062A\u062E\u062F\u0645 \u0647\u0630\u0627 \u0627\u0644\u0633\u062C\u0644 \u0645\u0639 \u0642\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0634\u0628\u0643\u0629 \u0642\u0628\u0644 \u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u062A\u0648\u0635\u064A\u0629 \u0627\u0644\u0646\u0647\u0627\u0626\u064A\u0629.",
      groupBonus: "\u0645\u0643\u0627\u0641\u0623\u0629 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629 \u0627\u0644\u0635\u062D\u064A\u062D\u0629",
      justificationScoreImpact: "\u062A\u0623\u062B\u064A\u0631 \u0627\u0644\u062A\u0628\u0631\u064A\u0631 \u0639\u0644\u0649 \u0627\u0644\u0646\u062A\u064A\u062C\u0629",
      justificationCorrectStep: "\u062A\u0628\u0631\u064A\u0631 \u0635\u062D\u064A\u062D: \u062D\u062F\u062F\u062A \u0627\u0644\u0639\u0648\u0627\u0645\u0644 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0647\u0630\u0647 \u0627\u0644\u062E\u0637\u0648\u0629.",
      selectionBonusResult: "\u0645\u0643\u0627\u0641\u0623\u0629 \u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A",
      justificationImpactResult: "\u0623\u062B\u0631 \u0627\u0644\u062A\u0628\u0631\u064A\u0631",
      points: "\u0646\u0642\u0637\u0629",
      reviewRequired: "\u0645\u0631\u0627\u062C\u0639\u0629 \u0645\u0637\u0644\u0648\u0628\u0629",
      extraTime: "\u0648\u0642\u062A \u0625\u0636\u0627\u0641\u064A (\u0645\u0636\u0627\u0639\u0641\u0629 \u0627\u0644\u0645\u0624\u0642\u062A)",
      exportProgress: "\u062A\u0635\u062F\u064A\u0631 \u0627\u0644\u062A\u0642\u062F\u0645 \u0643\u0645\u0644\u0641 JSON",
      importProgress: "\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0627\u0644\u062A\u0642\u062F\u0645 \u0645\u0646 \u0645\u0644\u0641",
      resetProgress: "\u062A\u0635\u0641\u064A\u0631 \u0627\u0644\u062A\u0642\u062F\u0645 \u0627\u0644\u0645\u062D\u0641\u0648\u0638",
      resetConfirm: "\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F \u0645\u0646 \u062A\u0635\u0641\u064A\u0631 \u0643\u0644 \u0627\u0644\u062A\u0642\u062F\u0645 \u0627\u0644\u0645\u062D\u0641\u0648\u0638\u061F \u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u062A\u0631\u0627\u062C\u0639 \u0639\u0646 \u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621.",
      progressImportSuccess: "\u062A\u0645 \u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0627\u0644\u062A\u0642\u062F\u0645 \u0628\u0646\u062C\u0627\u062D!",
      progressImportFailed: "\u0645\u0644\u0641 \u0627\u0644\u062A\u0642\u062F\u0645 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0623\u0648 \u062A\u0627\u0644\u0641.",
      pressureGauge: "\u0645\u0642\u064A\u0627\u0633 \u0627\u0644\u0636\u063A\u0637",
      flowMeter: "\u0645\u0642\u064A\u0627\u0633 \u0627\u0644\u062A\u062F\u0641\u0642",
      pipeDiameterTool: "\u0623\u062F\u0627\u0629 \u0642\u064A\u0627\u0633 \u0627\u0644\u0642\u0637\u0631",
      elevationMeter: "\u0645\u0642\u064A\u0627\u0633 \u0627\u0644\u0645\u0646\u0633\u0648\u0628",
      waterLevelSensor: "\u062D\u0633\u0627\u0633 \u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0645\u064A\u0627\u0647",
      velocitySensor: "\u062D\u0633\u0627\u0633 \u0627\u0644\u0633\u0631\u0639\u0629",
      temperatureSensor: "\u062D\u0633\u0627\u0633 \u062F\u0631\u062C\u0629 \u0627\u0644\u062D\u0631\u0627\u0631\u0629",
      pumpMonitor: "\u0645\u0631\u0627\u0642\u0628 \u0627\u0644\u0645\u0636\u062E\u0629",
      valveController: "\u0645\u062A\u062D\u0643\u0645 \u0627\u0644\u0635\u0645\u0627\u0645\u0627\u062A",
      leakDetector: "\u0643\u0627\u0634\u0641 \u0627\u0644\u062A\u0633\u0631\u0628",
      none: "\u0644\u0627 \u064A\u0648\u062C\u062F"
    },
    en: {
      appName: "Emergency Engineer",
      start: "Start playing",
      play: "Choose a stage",
      about: "About the game",
      continue: "Continue",
      back: "Back",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      welcome: "Welcome",
      welcomeText: "Practice reading indicators, weighing evidence, and making responsible engineering decisions.",
      playerName: "Student name",
      educationLevel: "Education level",
      chooseLevel: "Choose your study level (optional)",
      levelUnspecified: "Prefer not to choose yet",
      levelYear1: "First year",
      levelYear2: "Second year",
      levelYear3: "Third year",
      levelMaster: "Master / Advanced",
      aboutTitle: "How does the game work?",
      aboutBody: "Each stage is an engineering mission. Read the situation, analyze measurements, choose an action, and justify it. Mistakes reduce system health and show learning feedback. Scores follow the stage\u2019s existing rules.",
      aboutProgress: "Success unlocks the next stage. You can retry and review your best score.",
      aboutTools: "Tools and parameters support analysis. The map is a visual network representation, not a live hydraulic simulation.",
      skipIntro: "Skip the guide",
      overview: "Command Center",
      stages: "Stages",
      notebook: "Engineer Notebook",
      eventLog: "Event Log",
      tools: "Tools & Knowledge",
      achievements: "Achievements",
      settings: "Settings",
      profile: "Player profile",
      completed: "Stages completed",
      bestScore: "Best score",
      averageScore: "Average score",
      correctAnswers: "Correct answers",
      errors: "Errors",
      timePlayed: "Recorded play time",
      rank: "Learning rank",
      addNote: "Add a note",
      noteTitle: "Note title",
      noteBody: "Write what you learned or want to review",
      edit: "Edit",
      delete: "Delete",
      noNotes: "No notes yet.",
      noEvents: "Important attempts will appear here.",
      noTools: "Complete stages to discover concepts.",
      language: "Language",
      arabic: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
      english: "English",
      sound: "Sound effects",
      music: "Music",
      on: "On",
      off: "Off",
      menu: "Menu",
      currentStage: "Current stage",
      progress: "Progress",
      timeRemaining: "Time remaining",
      unlocked: "Unlocked",
      locked: "Locked",
      done: "Completed",
      stage: "Stage",
      prerequisites: "Knowledge for this stage",
      studyFirst: "Review the concept, then continue, or start the stage now.",
      studyAndContinue: "Study and continue",
      startAnyway: "Start without studying",
      studied: "Reviewed",
      learningLevel: "Stage level",
      difficulty: "Difficulty",
      concepts: "Concepts",
      outcome: "Learning outcome",
      success: "Correct answer",
      wrong: "Incorrect answer",
      earned: "Good work. Continue your analysis.",
      missed: "Review the evidence and explanation, then try again.",
      closeToast: "Close notification",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      resetMap: "Reset map view",
      stageCompleted: "Stage completed",
      stageFailed: "Attempt ended",
      stageUnlocked: "New stage unlocked",
      firstMission: "First Mission",
      fiveMissions: "Hydraulic Analyst",
      noMistakes: "Precise Engineer",
      finalMission: "Emergency Engineer",
      noPrerequisiteBlock: "Prerequisites are for learning, not a lock. You can start this stage at any time.",
      completedCount: "Stages completed",
      elapsed: "Duration",
      score: "Score",
      health: "System health",
      budget: "Budget",
      rankMasterEngineer: "Master Engineer",
      rankSeniorEngineer: "Senior Engineer",
      rankHydraulicEngineer: "Hydraulic Engineer",
      rankJuniorEngineer: "Junior Engineer",
      rankTrainingRequired: "Additional training required",
      arabicStageNotice: "Some stage-authored content is currently available in Arabic.",
      difficultyBeginner: "Beginner",
      difficultyIntermediate: "Intermediate",
      difficultyAdvanced: "Advanced",
      difficultyExpert: "Expert",
      noObjective: "This stage has no objective.",
      unsupportedObjective: "This objective type is not supported by the interface yet.",
      chooseOption: "Choose the best option",
      chooseMultiple: "Select all relevant options",
      submitOptions: "Check selections",
      enterCalculation: "Enter the calculated value",
      valuePlaceholder: "Value",
      confirm: "Confirm",
      diagnose: "Diagnose the issue",
      hint: "Hint",
      continueStep: "Continue to step",
      completedStep: "Step completed",
      justificationExcellent: "Excellent justification \u2014 you selected all correct factors without an unsuitable one.",
      selectedPipe: "Selected pipe",
      selectedNode: "Selected node",
      part: "Part",
      diagnosticStep: "Diagnostic step",
      investigationSummary: "Investigation Summary",
      choicesMatchEvidence: "Selections are consistent with evidence",
      choicesNeedReview: "Some selections are missing or need review",
      summaryNote: "Use this record alongside network readings before confirming your final recommendation.",
      groupBonus: "Correct group bonus",
      justificationScoreImpact: "Justification impact on score",
      justificationCorrectStep: "Correct justification: you selected the appropriate factors for this step.",
      selectionBonusResult: "Selection bonus",
      justificationImpactResult: "Justification impact",
      points: "points",
      reviewRequired: "Review Required",
      extraTime: "Extra time (2x timer limit)",
      exportProgress: "Export Progress (JSON)",
      importProgress: "Import Progress",
      resetProgress: "Reset Progress",
      resetConfirm: "Are you sure you want to reset all saved progress? This action cannot be undone.",
      progressImportSuccess: "Progress imported successfully!",
      progressImportFailed: "Invalid or corrupt progress file.",
      pressureGauge: "Pressure Gauge",
      flowMeter: "Flow Meter",
      pipeDiameterTool: "Pipe Caliper",
      elevationMeter: "Elevation Meter",
      waterLevelSensor: "Water Level Sensor",
      velocitySensor: "Velocity Sensor",
      temperatureSensor: "Temperature Sensor",
      pumpMonitor: "Pump Monitor",
      valveController: "Valve Controller",
      leakDetector: "Leak Detector",
      none: "None"
    }
  };
  var language = getSettings().language === "en" ? "en" : "ar";
  function getLanguage() {
    return language;
  }
  function setLanguage(next) {
    language = next === "en" ? "en" : "ar";
    updateSettings({ language });
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
      document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("languagechange", { detail: language }));
    }
  }
  function t(key) {
    return STRINGS[language]?.[key] ?? STRINGS.ar[key] ?? key;
  }
  setLanguage(language);

  // js/progress-store.js
  var STORAGE_KEY2 = "emergencyEngineer:progress:v1";
  var LEGACY_STORAGE_KEY = "emergencyEngineer:progress";
  function defaultProgress() {
    return {
      studentName: "",
      unlockedStageIds: [],
      bestScores: {},
      completedStageIds: []
    };
  }
  var memoryStore2 = /* @__PURE__ */ new Map();
  function getStorageItem2(key) {
    if (typeof localStorage !== "undefined") return localStorage.getItem(key);
    return memoryStore2.get(key) ?? null;
  }
  function setStorageItem2(key, val) {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, val);
    } else {
      memoryStore2.set(key, val);
    }
  }
  function removeStorageItem(key) {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
    } else {
      memoryStore2.delete(key);
    }
  }
  function readRaw() {
    try {
      const raw = getStorageItem2(STORAGE_KEY2);
      if (raw) return JSON.parse(raw);
      const legacy = getStorageItem2(LEGACY_STORAGE_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        writeRaw(parsed);
        return parsed;
      }
      return null;
    } catch (err) {
      console.warn("[progress-store] \u062A\u0639\u0630\u0651\u0631\u062A \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u062A\u0642\u062F\u0645 \u0627\u0644\u0645\u062D\u0641\u0648\u0638:", err);
      return null;
    }
  }
  function writeRaw(data) {
    try {
      setStorageItem2(STORAGE_KEY2, JSON.stringify(data));
    } catch (err) {
      console.warn("[progress-store] \u062A\u0639\u0630\u0651\u0631 \u062D\u0641\u0638 \u0627\u0644\u062A\u0642\u062F\u0645:", err);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("emergency-engineer:storage-error", { detail: String(err) }));
      }
    }
  }
  function repairShape(raw) {
    if (!raw || typeof raw !== "object") return defaultProgress();
    const d = defaultProgress();
    d.studentName = typeof raw.studentName === "string" ? raw.studentName : d.studentName;
    d.unlockedStageIds = Array.isArray(raw.unlockedStageIds) ? raw.unlockedStageIds.filter((id) => typeof id === "string") : d.unlockedStageIds;
    d.bestScores = raw.bestScores && typeof raw.bestScores === "object" && !Array.isArray(raw.bestScores) ? raw.bestScores : d.bestScores;
    d.completedStageIds = Array.isArray(raw.completedStageIds) ? raw.completedStageIds.filter((id) => typeof id === "string") : d.completedStageIds;
    return d;
  }
  function load() {
    return repairShape({ ...defaultProgress(), ...readRaw() ?? {} });
  }
  function getStudentName() {
    return load().studentName || "";
  }
  function setStudentName(name) {
    const data = load();
    data.studentName = name;
    writeRaw(data);
  }
  var REVIEW_KEY = "emergencyEngineer:reviewMode";
  function isReviewMode() {
    if (typeof window !== "undefined" && window.__REVIEW_MODE__ === true) return true;
    try {
      if (typeof window !== "undefined" && window.location && (window.location.search.includes("review") || window.location.search.includes("dev") || window.location.search.includes("all"))) {
        return true;
      }
      if (getStorageItem2(REVIEW_KEY) === "true") return true;
    } catch {
    }
    return false;
  }
  function setReviewMode(enabled) {
    if (typeof window !== "undefined") {
      window.__REVIEW_MODE__ = !!enabled;
    }
    try {
      setStorageItem2(REVIEW_KEY, enabled ? "true" : "false");
    } catch {
    }
  }
  function isStageUnlocked(stageId) {
    if (isReviewMode()) return true;
    return load().unlockedStageIds.includes(stageId);
  }
  function unlockAllStages(stageIds = []) {
    const data = load();
    if (Array.isArray(stageIds)) {
      stageIds.forEach((id) => {
        if (!data.unlockedStageIds.includes(id)) {
          data.unlockedStageIds.push(id);
        }
      });
      writeRaw(data);
    }
  }
  function unlockStage(stageId) {
    const data = load();
    if (!data.unlockedStageIds.includes(stageId)) {
      data.unlockedStageIds.push(stageId);
      writeRaw(data);
    }
  }
  function ensureFirstStageUnlocked(firstStageId) {
    unlockStage(firstStageId);
  }
  function getBestScore(stageId) {
    return load().bestScores[stageId] ?? null;
  }
  function isStageCompleted(stageId) {
    return load().completedStageIds.includes(stageId);
  }
  function recordStageResult(stageId, { success, score }) {
    const data = load();
    if (success) {
      const prevBest = data.bestScores[stageId] ?? null;
      if (prevBest === null || score > prevBest) {
        data.bestScores[stageId] = score;
      }
      if (!data.completedStageIds.includes(stageId)) {
        data.completedStageIds.push(stageId);
      }
      writeRaw(data);
    }
    return { bestScore: data.bestScores[stageId] ?? null };
  }
  function exportProgress() {
    const exportPayload = {
      format: "emergency-engineer-progress",
      version: 1,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      progress: load()
    };
    return JSON.stringify(exportPayload, null, 2);
  }
  function importProgress(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      const progressData = parsed.progress ?? parsed;
      if (!progressData || typeof progressData !== "object") return false;
      if (progressData.unlockedStageIds && !Array.isArray(progressData.unlockedStageIds)) return false;
      if (progressData.completedStageIds && !Array.isArray(progressData.completedStageIds)) return false;
      if (progressData.bestScores && (typeof progressData.bestScores !== "object" || Array.isArray(progressData.bestScores))) return false;
      const sanitized = repairShape(progressData);
      writeRaw(sanitized);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("emergency-engineer:progress-imported", { detail: sanitized }));
      }
      return true;
    } catch (err) {
      console.warn("[progress-store] \u062A\u0639\u0630\u0651\u0631 \u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0627\u0644\u062A\u0642\u062F\u0645:", err);
      return false;
    }
  }
  function resetProgress() {
    try {
      removeStorageItem(STORAGE_KEY2);
      removeStorageItem(LEGACY_STORAGE_KEY);
      removeStorageItem(REVIEW_KEY);
      if (typeof window !== "undefined") {
        window.__REVIEW_MODE__ = false;
        window.dispatchEvent(new CustomEvent("emergency-engineer:progress-reset"));
      }
      return true;
    } catch (err) {
      console.warn("[progress-store] \u062A\u0639\u0630\u0651\u0631 \u062A\u0635\u0641\u064A\u0631 \u0627\u0644\u062A\u0642\u062F\u0645:", err);
      return false;
    }
  }

  // js/audio-manager.js
  var context = null;
  var musicOscillator = null;
  var musicGain = null;
  var activated = false;
  var settings = getSettings();
  var unavailable = false;
  var errorReported = false;
  function reportAudioError(error) {
    unavailable = true;
    stopMusic();
    if (!errorReported) {
      errorReported = true;
      console.warn("[audio-manager] Audio is unavailable; gameplay will continue without sound.", error);
    }
  }
  function getContext() {
    if (unavailable) return null;
    if (!context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      try {
        context = new AudioContextClass();
      } catch (error) {
        reportAudioError(error);
        return null;
      }
    }
    try {
      if (context.state === "suspended") context.resume().catch(reportAudioError);
    } catch (error) {
      reportAudioError(error);
      return null;
    }
    return context;
  }
  function tone(frequency, duration = 0.09, type = "sine", volume = 0.055) {
    if (!settings.soundEnabled || !activated) return;
    const ctx = getContext();
    if (!ctx) return;
    try {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(1e-3, ctx.currentTime + duration);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      reportAudioError(error);
    }
  }
  function startMusic() {
    if (!settings.musicEnabled || !activated || musicOscillator) return;
    const ctx = getContext();
    if (!ctx) return;
    try {
      musicOscillator = ctx.createOscillator();
      musicGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      musicOscillator.type = "triangle";
      musicOscillator.frequency.value = 110;
      filter.type = "lowpass";
      filter.frequency.value = 260;
      musicGain.gain.value = 0.012;
      musicOscillator.connect(filter).connect(musicGain).connect(ctx.destination);
      musicOscillator.start();
    } catch (error) {
      stopMusic();
      reportAudioError(error);
    }
  }
  function stopMusic() {
    const oscillator = musicOscillator;
    const gain = musicGain;
    musicOscillator = null;
    musicGain = null;
    if (!oscillator) return;
    try {
      oscillator.stop();
    } catch (error) {
      if (!errorReported) console.warn("[audio-manager] Could not stop ambient audio cleanly.", error);
    }
    try {
      oscillator.disconnect();
      gain?.disconnect();
    } catch (error) {
      reportAudioError(error);
    }
  }
  function activateAudio() {
    activated = true;
    if (settings.musicEnabled) startMusic();
  }
  function getAudioSettings() {
    return { ...settings };
  }
  function setAudioSettings(patch) {
    settings = updateSettings(patch);
    if (settings.musicEnabled) startMusic();
    else stopMusic();
    return { ...settings };
  }
  var playUiSound = () => tone(620, 0.045, "sine", 0.025);
  var playSelectSound = () => tone(470, 0.07, "triangle", 0.04);
  var playSuccessSound = () => {
    tone(660, 0.12);
    setTimeout(() => tone(880, 0.14), 90);
  };
  var playErrorSound = () => {
    tone(210, 0.16, "triangle", 0.05);
  };
  var playUnlockSound = () => {
    tone(520, 0.1);
    setTimeout(() => tone(780, 0.16), 100);
  };
  var playTransitionSound = () => tone(360, 0.12, "sine", 0.03);
  document.addEventListener("pointerdown", activateAudio, { once: true, passive: true });
  document.addEventListener("keydown", activateAudio, { once: true });
  document.addEventListener("click", (event) => {
    if (event.target?.closest?.('button, [role="button"], a')) playUiSound();
  }, true);

  // js/learning-service.js
  var import_meta = {};
  var catalogPromise = null;
  var LEARNING_CATALOG_URL = typeof import_meta !== "undefined" && import_meta.url ? new URL("../data/learning-content.json", import_meta.url) : null;
  function loadLearningCatalog() {
    if (typeof window !== "undefined" && window.__EMERGENCY_DATA__?.learningContent) {
      return Promise.resolve(window.__EMERGENCY_DATA__.learningContent);
    }
    if (!catalogPromise) {
      if (!LEARNING_CATALOG_URL) {
        return Promise.reject(new Error("Learning catalog URL not configured"));
      }
      catalogPromise = fetch(LEARNING_CATALOG_URL).then((response) => {
        if (!response.ok) throw new Error(`Learning metadata unavailable (${response.status})`);
        return response.json();
      }).catch((error) => {
        catalogPromise = null;
        throw error;
      });
    }
    return catalogPromise;
  }
  function localText(value) {
    if (value && typeof value === "object") return value[getLanguage()] ?? value.ar ?? "";
    return value ?? "";
  }
  async function getStageLearning(stageId) {
    const catalog = await loadLearningCatalog();
    return { ...catalog.stages?.[stageId] ?? {}, catalog };
  }
  function getMissingPrerequisites(metadata) {
    const studied = new Set(getStudiedConcepts());
    return (metadata.prerequisites ?? []).filter((id) => !studied.has(id));
  }
  function studyConcepts(conceptIds) {
    conceptIds.forEach(markConceptStudied);
  }

  // js/ui/player-drawer.js
  var PANELS = ["overview", "stages", "notebook", "eventLog", "tools", "achievements", "settings"];
  function mountPlayerDrawer(container, { studentName = "", stages = [], currentStage = null, activeMission: activeMission2 = false, onLanguageChange } = {}) {
    const host = document.createElement("div");
    host.className = "player-drawer-host";
    host.innerHTML = `
    <button class="drawer-trigger" type="button" aria-label="${t("menu")}" aria-expanded="false">\u2630 <span>${t("menu")}</span></button>
    <div class="drawer-backdrop" hidden>
      <aside class="player-drawer" role="dialog" aria-modal="true" aria-label="${t("menu")}">
        <div class="drawer-heading"><div><span class="eyebrow">HYDRAULIC / OPS</span><strong>${escapeHtml(studentName || t("profile"))}</strong></div><button class="icon-button" data-drawer-close aria-label="${t("close")}">\xD7</button></div>
        ${currentStage ? `<div class="drawer-current"><small>${t("currentStage")}</small><strong>${escapeHtml(stageLabel(currentStage, stages))}</strong><div class="progress-track"><i style="width:${Math.round(currentStage.stageIndexInLevel / Math.max(stages.length, 1) * 100)}%"></i></div><small>${t("progress")} \xB7 ${currentStage.stageIndexInLevel} / ${stages.length}</small></div>` : ""}
        <nav class="drawer-tabs" aria-label="${t("menu")}">${PANELS.map((key) => `<button type="button" data-panel="${key}">${t(key)}</button>`).join("")}</nav>
        <div class="drawer-content" data-drawer-content></div>
      </aside>
    </div>`;
    container.appendChild(host);
    const trigger = host.querySelector(".drawer-trigger");
    const backdrop = host.querySelector(".drawer-backdrop");
    const content = host.querySelector("[data-drawer-content]");
    let activePanel = "overview";
    let editingNoteId = null;
    function open() {
      backdrop.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      renderPanel();
      host.querySelector("[data-drawer-close]").focus();
    }
    function close() {
      backdrop.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      trigger.focus();
    }
    function renderPanel() {
      host.querySelectorAll("[data-panel]").forEach((button) => button.classList.toggle("is-active", button.dataset.panel === activePanel));
      if (activePanel === "overview") renderOverview();
      if (activePanel === "stages") renderStages();
      if (activePanel === "notebook") renderNotebook();
      if (activePanel === "eventLog") renderEvents();
      if (activePanel === "tools") renderTools2();
      if (activePanel === "achievements") renderAchievements();
      if (activePanel === "settings") renderSettings();
    }
    function renderOverview() {
      const completed = stages.filter((stage) => isStageCompleted(stage.stageId)).length;
      const events = getEvents();
      const attempts = events.filter((event) => event.type === "stageAttempt");
      const totalErrors = attempts.reduce((sum, event) => sum + (event.errorCount ?? 0), 0);
      const correct = attempts.reduce((sum, event) => sum + (event.correctCount ?? 0), 0);
      const seconds = attempts.reduce((sum, event) => sum + (event.elapsedSeconds ?? 0), 0);
      const avg = attempts.length ? Math.round(attempts.reduce((sum, event) => sum + (event.score ?? 0), 0) / attempts.length) : null;
      const rank = completed >= 20 ? getLanguage() === "ar" ? "\u0645\u0647\u0646\u062F\u0633 \u0627\u0644\u0637\u0648\u0627\u0631\u0626" : "Emergency Engineer" : completed >= 10 ? getLanguage() === "ar" ? "\u0645\u062D\u0642\u0642 \u0645\u064A\u062F\u0627\u0646\u064A" : "Field Investigator" : completed >= 5 ? getLanguage() === "ar" ? "\u0645\u062D\u0644\u0644 \u0647\u064A\u062F\u0631\u0648\u0644\u064A\u0643\u064A" : "Hydraulic Analyst" : completed ? getLanguage() === "ar" ? "\u0645\u0647\u0646\u062F\u0633 \u0645\u062A\u062F\u0631\u0628" : "Trainee Engineer" : getLanguage() === "ar" ? "\u0645\u0647\u0646\u062F\u0633 \u062C\u062F\u064A\u062F" : "New Engineer";
      content.innerHTML = `<section class="drawer-panel"><p class="eyebrow">${t("profile")}</p><label>${t("educationLevel")}<select data-profile-level>${educationOptions()}</select></label><div class="hub-stats"><article><strong>${completed}</strong><span>${t("completed")}</span></article><article><strong>${avg ?? "\u2014"}</strong><span>${t("averageScore")}</span></article><article><strong>${correct}</strong><span>${t("correctAnswers")}</span></article><article><strong>${totalErrors}</strong><span>${t("errors")}</span></article><article><strong>${formatDuration(seconds)}</strong><span>${t("timePlayed")}</span></article><article><strong>${rank}</strong><span>${t("rank")}</span></article></div><p class="hub-footnote">${getLanguage() === "ar" ? "\u0627\u0644\u0625\u062D\u0635\u0627\u0621\u0627\u062A \u0627\u0644\u062A\u0641\u0635\u064A\u0644\u064A\u0629 \u062A\u064F\u0633\u062C\u0644 \u0645\u0646 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0628\u0639\u062F \u0647\u0630\u0627 \u0627\u0644\u062A\u062D\u062F\u064A\u062B." : "Detailed attempt statistics are recorded from this update onward."}</p></section>`;
      const level = content.querySelector("[data-profile-level]");
      level.value = getProfile().educationLevel ?? "unspecified";
      level.addEventListener("change", () => updateProfile({ educationLevel: level.value }));
    }
    function renderStages() {
      content.innerHTML = `<section class="drawer-panel"><div class="drawer-stage-list">${stages.map((stage) => {
        const unlocked = isStageUnlocked(stage.stageId);
        const complete = isStageCompleted(stage.stageId);
        const mark = complete ? "\u2713" : unlocked ? "\u25CF" : "\u{1F512}";
        return `<article class="drawer-stage-row"><span>${mark}</span><div><strong>${t("stage")} ${stage.stageIndexInLevel} \xB7 ${escapeHtml(stage.titleArabic ?? stage.stageId)}</strong><small>${complete ? t("done") : unlocked ? t("unlocked") : t("locked")} \xB7 ${t("bestScore")}: ${getBestScore(stage.stageId) ?? "\u2014"}</small></div></article>`;
      }).join("")}</div></section>`;
    }
    function renderNotebook() {
      const notes = getNotes();
      const note = notes.find((item) => item.id === editingNoteId);
      content.innerHTML = `<section class="drawer-panel"><form class="note-form"><label>${t("noteTitle")}<input name="title" maxlength="90" value="${escapeAttr(note?.title ?? "")}" required /></label><label>${t("noteBody")}<textarea name="body" rows="4" maxlength="2000" required>${escapeHtml(note?.body ?? "")}</textarea></label><button class="button button--primary" type="submit">${note ? t("save") : t("addNote")}</button>${note ? `<button class="text-button" type="button" data-cancel-edit>${t("cancel")}</button>` : ""}</form><div class="note-list">${notes.length ? notes.map((item) => `<article class="note-card"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.body)}</p><div><button type="button" data-edit-note="${item.id}">${t("edit")}</button><button type="button" data-delete-note="${item.id}">${t("delete")}</button></div></article>`).join("") : `<p class="empty-state">${t("noNotes")}</p>`}</div></section>`;
      content.querySelector(".note-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        saveNote({ id: editingNoteId, title: String(form.get("title")).trim(), body: String(form.get("body")).trim() });
        editingNoteId = null;
        renderNotebook();
      });
      content.querySelector("[data-cancel-edit]")?.addEventListener("click", () => {
        editingNoteId = null;
        renderNotebook();
      });
      content.querySelectorAll("[data-edit-note]").forEach((button) => button.addEventListener("click", () => {
        editingNoteId = button.dataset.editNote;
        renderNotebook();
      }));
      content.querySelectorAll("[data-delete-note]").forEach((button) => button.addEventListener("click", () => {
        deleteNote(button.dataset.deleteNote);
        renderNotebook();
      }));
    }
    function renderEvents() {
      const events = getEvents();
      content.innerHTML = `<section class="drawer-panel event-list">${events.length ? events.map((event) => `<article class="event-row"><span class="event-mark ${event.success ? "is-success" : ""}">${event.type === "stageUnlocked" ? "\u2197" : event.success ? "\u2713" : "!"}</span><div><strong>${event.type === "stageUnlocked" ? t("stageUnlocked") : event.success ? t("stageCompleted") : t("stageFailed")} \xB7 ${t("stage")} ${event.stageIndex ?? ""}</strong><small>${escapeHtml(new Date(event.createdAt).toLocaleString(getLanguage() === "ar" ? "ar" : "en"))}${event.type === "stageAttempt" ? ` \xB7 ${t("score")} ${event.score}/100 \xB7 ${t("elapsed")} ${formatDuration(event.elapsedSeconds)}` : ""}</small></div></article>`).join("") : `<p class="empty-state">${t("noEvents")}</p>`}</section>`;
    }
    async function renderTools2() {
      content.innerHTML = `<section class="drawer-panel"><p class="empty-state">${t("noTools")}</p></section>`;
      try {
        const catalog = await loadLearningCatalog();
        if (!host.isConnected || activePanel !== "tools") return;
        const ids = new Set(getStudiedConcepts());
        stages.filter((stage) => isStageCompleted(stage.stageId)).forEach((stage) => catalog.stages?.[stage.stageId]?.concepts?.forEach((id) => ids.add(id)));
        content.innerHTML = `<section class="drawer-panel concept-list">${ids.size ? [...ids].map((id) => {
          const concept = catalog.concepts[id];
          return concept ? `<article class="concept-card"><span>\u2713</span><div><strong>${escapeHtml(concept.title[getLanguage()] ?? concept.title.ar)}</strong><small>${escapeHtml(concept.formula ?? "")}</small><p>${escapeHtml(concept.definition[getLanguage()] ?? concept.definition.ar)}</p></div></article>` : "";
        }).join("") : `<p class="empty-state">${t("noTools")}</p>`}</section>`;
      } catch (error) {
        console.warn("[player-drawer] Could not load learning catalog:", error);
        if (host.isConnected && activePanel === "tools") {
          content.innerHTML = `<section class="drawer-panel"><p class="empty-state">${t("noTools")}</p></section>`;
        }
      }
    }
    function renderAchievements() {
      const completedIds = stages.filter((stage) => isStageCompleted(stage.stageId)).map((stage) => stage.stageId);
      const events = getEvents().filter((event) => event.type === "stageAttempt");
      const earned = [
        ["firstMission", completedIds.length >= 1],
        ["fiveMissions", completedIds.length >= 5],
        ["noMistakes", events.some((event) => event.success && event.errorCount === 0)],
        ["finalMission", completedIds.includes("L3_S20_FinalCapstone")]
      ];
      content.innerHTML = `<section class="drawer-panel achievement-grid">${earned.map(([key, unlocked]) => `<article class="achievement-card ${unlocked ? "is-earned" : ""}"><span>${unlocked ? "\u2605" : "\u25C7"}</span><strong>${t(key)}</strong><small>${unlocked ? t("done") : t("locked")}</small></article>`).join("")}</section>`;
    }
    function renderSettings() {
      const audio = getAudioSettings();
      const settings2 = getSettings();
      content.innerHTML = `
      <section class="drawer-panel settings-list">
        <label>${t("language")}<select data-language ${activeMission2 ? "disabled" : ""}><option value="ar">${t("arabic")}</option><option value="en">${t("english")}</option></select></label>
        ${activeMission2 ? `<p class="hub-footnote">${getLanguage() === "ar" ? "\u063A\u064A\u0651\u0631 \u0627\u0644\u0644\u063A\u0629 \u0628\u0639\u062F \u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0645\u0647\u0645\u0629 \u0644\u062A\u062C\u0646\u0628 \u0641\u0642\u062F\u0627\u0646 \u0645\u062D\u0627\u0648\u0644\u062A\u0643 \u0627\u0644\u062D\u0627\u0644\u064A\u0629." : "Change language after this mission to preserve your current attempt."}</p>` : ""}
        <label class="setting-toggle"><span>${t("sound")}</span><input type="checkbox" data-sound ${audio.soundEnabled ? "checked" : ""}></label>
        <label class="setting-toggle"><span>${t("music")}</span><input type="checkbox" data-music ${audio.musicEnabled ? "checked" : ""}></label>
        <label class="setting-toggle"><span>${t("extraTime")}</span><input type="checkbox" data-extra-time ${settings2.extraTime ? "checked" : ""}></label>
        <p class="hub-footnote">${getLanguage() === "ar" ? "\u0627\u0644\u0645\u0648\u0633\u064A\u0642\u0649 \u0646\u063A\u0645\u0629 \u0645\u062D\u064A\u0637\u064A\u0629 \u0645\u0648\u0644\u062F\u0629 \u0645\u062D\u0644\u064A\u064B\u0627\u060C \u0648\u0644\u0627 \u062A\u0639\u0645\u0644 \u0642\u0628\u0644 \u0623\u0648\u0644 \u062A\u0641\u0627\u0639\u0644." : "Ambient music is generated locally and will not play before your first interaction."}</p>
        <div class="drawer-storage-actions" style="margin-top: 16px; display: flex; flex-direction: column; gap: 8px;">
          <button class="button button--secondary" type="button" data-toggle-review style="color:var(--brass);border-color:var(--brass);">
            ${isReviewMode() ? getLanguage() === "ar" ? "\u{1F513} \u0648\u0636\u0639 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629: \u0645\u0641\u0639\u0651\u0644 (\u0627\u0644\u0645\u0631\u0627\u062D\u0644 \u0645\u0641\u062A\u0648\u062D\u0629)" : "\u{1F513} Review Mode: Active" : getLanguage() === "ar" ? "\u{1F512} \u0641\u062A\u062D \u0643\u0644 \u0627\u0644\u0645\u0631\u0627\u062D\u0644 \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u0629" : "\u{1F512} Unlock All for Review"}
          </button>
          <button class="button button--secondary" type="button" data-export-progress>${t("exportProgress")}</button>
          <label class="button button--secondary" style="display:flex;align-items:center;justify-content:center;cursor:pointer;">
            <span>${t("importProgress")}</span>
            <input type="file" accept=".json,application/json" data-import-file style="display:none;" />
          </label>
          <button class="button button--secondary" type="button" data-reset-progress style="color:var(--hazard);border-color:var(--hazard);">${t("resetProgress")}</button>
        </div>
      </section>
    `;
      const language2 = content.querySelector("[data-language]");
      language2.value = getLanguage();
      language2.addEventListener("change", () => {
        setLanguage(language2.value);
        if (onLanguageChange) onLanguageChange(language2.value);
        else renderPanel();
      });
      content.querySelector("[data-sound]").addEventListener("change", (event) => setAudioSettings({ soundEnabled: event.target.checked }));
      content.querySelector("[data-music]").addEventListener("change", (event) => setAudioSettings({ musicEnabled: event.target.checked }));
      content.querySelector("[data-extra-time]").addEventListener("change", (event) => updateSettings({ extraTime: event.target.checked }));
      content.querySelector("[data-toggle-review]")?.addEventListener("click", () => {
        const next = !isReviewMode();
        setReviewMode(next);
        if (next) unlockAllStages(stages.map((s) => s.stageId));
        renderPanel();
      });
      content.querySelector("[data-export-progress]").addEventListener("click", () => {
        const json = exportProgress();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `emergency-engineer-progress-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
      content.querySelector("[data-import-file]").addEventListener("change", (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result;
          const success = importProgress(String(text));
          if (success) {
            alert(t("progressImportSuccess"));
            renderPanel();
          } else {
            alert(t("progressImportFailed"));
          }
        };
        reader.readAsText(file);
      });
      content.querySelector("[data-reset-progress]").addEventListener("click", () => {
        if (confirm(t("resetConfirm"))) {
          resetProgress();
          location.reload();
        }
      });
    }
    trigger.addEventListener("click", open);
    host.querySelector("[data-drawer-close]").addEventListener("click", close);
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) close();
    });
    host.querySelectorAll("[data-panel]").forEach((button) => button.addEventListener("click", () => {
      activePanel = button.dataset.panel;
      editingNoteId = null;
      renderPanel();
    }));
    host.addEventListener("keydown", (event) => {
      if (backdrop.hidden) return;
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key === "Tab") {
        const focusables = Array.from(host.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((el) => el.offsetParent !== null);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }
  function educationOptions() {
    return `<option value="unspecified">${t("levelUnspecified")}</option><option value="year1">${t("levelYear1")}</option><option value="year2">${t("levelYear2")}</option><option value="year3">${t("levelYear3")}</option><option value="master">${t("levelMaster")}</option>`;
  }
  function stageLabel(current, stages) {
    const stage = stages.find((item) => item.stageId === current.stageId);
    return `${t("stage")} ${current.stageIndexInLevel}: ${stage?.titleArabic ?? current.titleArabic ?? ""}`;
  }
  function formatDuration(seconds = 0) {
    return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }
  function escapeAttr(value) {
    return escapeHtml(value);
  }

  // js/ui/menu-screen.js
  function renderMenuScreen(container, { studentName, stages = [], onPlay, onAbout, onLanguageChange }) {
    container.innerHTML = `
    <main class="menu-screen">
      <div class="menu-grid-glow" aria-hidden="true"></div>
      <section class="menu-plate glass-panel">
        <div class="brand-mark" aria-hidden="true"><span>H\u2082O</span><i></i></div>
        <p class="eyebrow">HYDRAULIC / EMERGENCY RESPONSE</p>
        <h1 class="menu-title">${t("appName")}</h1>
        <p class="menu-subtitle">${t("welcomeText")}</p>
        ${studentName ? `<p class="menu-welcome">${t("welcome")}\u060C ${escapeHtml2(studentName)}</p>` : ""}
        <div class="menu-actions"><button class="button button--primary" data-action="play">${t("play")} <span aria-hidden="true">\u2197</span></button><button class="button button--secondary" data-action="about">${t("about")}</button></div>
        <div class="menu-signal"><span></span> SYSTEM READY <b>\u25CF</b></div>
      </section>
    </main>
  `;
    container.querySelector('[data-action="play"]').addEventListener("click", () => onPlay());
    container.querySelector('[data-action="about"]').addEventListener("click", () => onAbout?.());
    mountPlayerDrawer(container, { studentName, stages, onLanguageChange });
  }
  function escapeHtml2(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  // js/ui/name-entry-screen.js
  function renderNameEntryScreen(container, { onSubmit, onLanguageChange }) {
    container.innerHTML = `
    <div class="menu-screen">
      <section class="menu-plate glass-panel name-entry-card">
        <div class="brand-mark" aria-hidden="true"><span>H\u2082O</span><i></i></div>
        <p class="eyebrow">HYDRAULIC / EMERGENCY RESPONSE</p>
        <h1 class="menu-title">${t("appName")}</h1>
        <form class="name-form" data-role="name-form">
          <label class="name-label" for="student-name">${t("playerName")}</label>
          <input
            class="name-input"
            id="student-name"
            type="text"
            placeholder="${t("playerName")}"
            autocomplete="off"
            required
          />
          <label class="name-label" for="education-level">${t("educationLevel")}</label>
          <select class="name-input" id="education-level" name="educationLevel">
            <option value="unspecified">${t("levelUnspecified")}</option><option value="year1">${t("levelYear1")}</option><option value="year2">${t("levelYear2")}</option><option value="year3">${t("levelYear3")}</option><option value="master">${t("levelMaster")}</option>
          </select>
          <button class="button button--primary" type="submit">${t("continue")}</button>
        </form>
        <button class="language-switch" data-language>${t("language")}: ${t("arabic")} / ${t("english")}</button>
      </section>
    </div>
  `;
    const form = container.querySelector('[data-role="name-form"]');
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = container.querySelector("#student-name");
      const name = input.value.trim();
      if (!name) return;
      onSubmit(name, container.querySelector("#education-level").value);
    });
    container.querySelector("[data-language]").addEventListener("click", () => {
      setLanguage(document.documentElement.lang === "ar" ? "en" : "ar");
      onLanguageChange?.();
    });
  }

  // js/ui/welcome-screen.js
  function renderWelcomeScreen(container, { studentName, onStart, onAbout }) {
    container.innerHTML = `
    <main class="welcome-screen">
      <section class="welcome-card glass-panel">
        <div class="brand-mark" aria-hidden="true"><span>H\u2082O</span><i></i></div>
        <p class="eyebrow">HYDRAULIC EMERGENCY ENGINEER</p>
        <h1>${t("welcome")}${studentName ? `\u060C ${escapeHtml3(studentName)}` : ""}</h1>
        <p class="welcome-copy">${t("welcomeText")}</p>
        <div class="welcome-actions">
          <button class="button button--primary" data-action="start">${t("start")} <span aria-hidden="true">\u2197</span></button>
          <button class="button button--secondary" data-action="about">${t("about")}</button>
          <button class="text-button" data-action="skip">${t("skipIntro")}</button>
        </div>
      </section>
    </main>`;
    container.querySelector('[data-action="start"]').addEventListener("click", onStart);
    container.querySelector('[data-action="skip"]').addEventListener("click", onStart);
    container.querySelector('[data-action="about"]').addEventListener("click", onAbout);
  }
  function renderAboutScreen(container, { studentName, onBack, onStart }) {
    const language2 = getLanguage();
    const steps = language2 === "ar" ? ["\u0627\u0642\u0631\u0623 \u0627\u0644\u062D\u0627\u0644\u0629 \u0648\u0627\u0644\u0642\u064A\u0627\u0633\u0627\u062A.", "\u062D\u0644\u0651\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u062E\u062A\u0631 \u0627\u0644\u0625\u062C\u0631\u0627\u0621.", "\u0628\u0631\u0631 \u0627\u0644\u0642\u0631\u0627\u0631 \u0648\u062A\u0639\u0644\u0645 \u0645\u0646 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A.", "\u0623\u0643\u0645\u0644 \u0627\u0644\u0645\u0647\u0645\u0629 \u0644\u0641\u062A\u062D \u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629."] : ["Read the situation and measurements.", "Analyze the data and choose an action.", "Justify your decision and learn from feedback.", "Complete the mission to unlock the next stage."];
    container.innerHTML = `
    <main class="about-screen">
      <section class="about-card glass-panel">
        <button class="icon-button about-back" data-action="back" aria-label="${t("back")}">\u2190</button>
        <p class="eyebrow">HYDRAULIC EMERGENCY ENGINEER</p>
        <h1>${t("aboutTitle")}</h1>
        <p>${t("aboutBody")}</p>
        <ol class="guide-steps">${steps.map((step, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span>${step}</li>`).join("")}</ol>
        <div class="learning-note">${t("aboutProgress")}<br/>${t("aboutTools")}</div>
        <div class="welcome-actions"><button class="button button--primary" data-action="start">${t("start")}</button><button class="button button--secondary" data-action="back">${t("back")}</button></div>
      </section>
    </main>`;
    container.querySelectorAll('[data-action="back"]').forEach((button) => button.addEventListener("click", onBack));
    container.querySelector('[data-action="start"]').addEventListener("click", onStart);
  }
  function escapeHtml3(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  // js/ui/stage-select-screen.js
  function renderStageSelectScreen(container, stages, { isUnlocked, getBestScore: getBestScore2, isCompleted = () => false, learning = {}, studentName = "", onSelectStage, onBack, onLanguageChange }) {
    const reviewActive = isReviewMode();
    container.innerHTML = `
    <div class="select-screen">
      <div class="select-header">
        <button class="hud-exit" data-action="back" title="${t("back")}" aria-label="${t("back")}">\u293A</button>
        <div style="flex: 1;"><p class="eyebrow">MISSION SELECT / 01\u2014${String(stages.length).padStart(2, "0")}</p><h2 class="select-title">${t("play")}</h2></div>
        <button
          type="button"
          class="review-mode-btn ${reviewActive ? "review-mode-btn--active" : ""}"
          data-action="toggle-review"
          title="${getLanguage() === "ar" ? "\u062A\u0628\u062F\u064A\u0644 \u0648\u0636\u0639 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0644\u0641\u062A\u062D \u0643\u0627\u0641\u0629 \u0627\u0644\u0645\u0631\u0627\u062D\u0644" : "Toggle Review Mode"}"
        >
          ${reviewActive ? "\u{1F513} " + (getLanguage() === "ar" ? "\u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629: \u0643\u0644 \u0627\u0644\u0645\u0631\u0627\u062D\u0644 \u0645\u0641\u062A\u0648\u062D\u0629" : "Review: All Unlocked") : "\u{1F512} " + (getLanguage() === "ar" ? "\u0641\u062A\u062D \u0643\u0644 \u0627\u0644\u0645\u0631\u0627\u062D\u0644 \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u0629" : "Unlock All for Review")}
        </button>
      </div>
      <div class="select-grid">
        ${stages.map((entry) => {
      const unlocked = isUnlocked(entry.stageId);
      const best = getBestScore2(entry.stageId);
      const metadata = learning[entry.stageId] ?? {};
      const status = isCompleted(entry.stageId) ? t("done") : unlocked ? best !== null ? `${t("bestScore")}: ${best} / 100` : t("unlocked") : `\u{1F512} ${t("locked")}`;
      return `
          <button
            class="stage-tile ${unlocked ? "" : "stage-tile--locked"} ${isCompleted(entry.stageId) ? "stage-tile--complete" : ""}"
            data-stage-id="${entry.stageId}"
            ${unlocked ? "" : "disabled"}
          >
            <span class="stage-tile-top"><span class="stage-tile-level">${t("stage")} ${String(entry.stageIndexInLevel).padStart(2, "0")}</span><span class="stage-state">${isCompleted(entry.stageId) ? "\u2713" : unlocked ? "\u2197" : "\u2311"}</span></span>
            <strong class="stage-tile-title">${getLanguage() === "en" ? metadata.titleEn ?? entry.titleArabic ?? entry.stageId : entry.titleArabic ?? entry.stageId}</strong>
            <span class="stage-tile-meta">${t("difficulty")}: ${metadata.difficulty ? t(`difficulty${metadata.difficulty}`) : "\u2014"} \xB7 ${t("learningLevel")}: ${metadata.academicLevel ? t(`level${metadata.academicLevel[0].toUpperCase()}${metadata.academicLevel.slice(1)}`) : "\u2014"}</span>
            <span class="stage-tile-status">${status}</span>
          </button>`;
    }).join("")}
      </div>
    </div>
  `;
    container.querySelector('[data-action="back"]').addEventListener("click", onBack);
    container.querySelector('[data-action="toggle-review"]')?.addEventListener("click", () => {
      const nextState = !isReviewMode();
      setReviewMode(nextState);
      if (nextState) {
        unlockAllStages(stages.map((s) => s.stageId));
      }
      renderStageSelectScreen(container, stages, {
        isUnlocked,
        getBestScore: getBestScore2,
        isCompleted,
        learning,
        studentName,
        onSelectStage,
        onBack,
        onLanguageChange
      });
    });
    container.querySelectorAll("[data-stage-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const entry = stages.find((s) => s.stageId === btn.dataset.stageId);
        if (entry) onSelectStage(entry);
      });
    });
    mountPlayerDrawer(container, { studentName, stages, onLanguageChange });
  }

  // js/core/stage-schema.js
  var LevelId = Object.freeze({
    HYDRAULIC_BASICS: 1,
    PIPE_FLOW: 2,
    NETWORKS: 3,
    OPEN_CHANNELS: 4,
    HYDRAULIC_EMERGENCIES: 5,
    MASTER_ENGINEER: 6
  });
  var ObjectiveType = Object.freeze({
    CALCULATION: "calculation",
    SELECTION: "selection",
    DIAGNOSIS: "diagnosis",
    MULTI_STEP: "multiStep"
  });
  var NodeKind = Object.freeze({
    RESERVOIR: "reservoir",
    TANK: "tank",
    JUNCTION: "junction",
    PUMP_STATION: "pumpStation",
    CONSUMER: "consumer"
  });
  var ToolType = Object.freeze({
    PRESSURE_GAUGE: "pressureGauge",
    FLOW_METER: "flowMeter",
    PIPE_DIAMETER_TOOL: "pipeDiameterTool",
    ELEVATION_METER: "elevationMeter",
    WATER_LEVEL_SENSOR: "waterLevelSensor",
    VELOCITY_SENSOR: "velocitySensor",
    TEMPERATURE_SENSOR: "temperatureSensor",
    PUMP_MONITOR: "pumpMonitor",
    VALVE_CONTROLLER: "valveController",
    LEAK_DETECTOR: "leakDetector"
  });
  var FormulaType = Object.freeze({
    CONTINUITY: "continuity",
    BERNOULLI: "bernoulli",
    DARCY_WEISBACH: "darcyWeisbach",
    REYNOLDS_NUMBER: "reynoldsNumber",
    HYDRAULIC_POWER: "hydraulicPower",
    MANNING_EQUATION: "manningEquation",
    HYDROSTATIC_PRESSURE: "hydrostaticPressure"
  });
  var MistakeSeverity = Object.freeze({
    MINOR: "minor",
    WRONG_CHOICE: "wrongChoice",
    CRITICAL: "critical"
  });
  var EngineeringRank = Object.freeze({
    EMERGENCY_TRAINING_REQUIRED: "emergencyTrainingRequired",
    JUNIOR_ENGINEER: "juniorEngineer",
    HYDRAULIC_ENGINEER: "hydraulicEngineer",
    SENIOR_ENGINEER: "seniorEngineer",
    MASTER_ENGINEER: "masterEngineer"
  });

  // js/core/stage-session.js
  var StageSession = class extends EventTarget {
    /** @param {import('./stage-schema.js').StageDefinition} stage */
    constructor(stage) {
      super();
      this.stage = stage;
      this.health = 100;
      this.elapsedSeconds = 0;
      this.budgetRemaining = stage.budgetEuro ?? 0;
      this.hintsUsed = 0;
      this.isFinished = false;
      this._revealedKeys = /* @__PURE__ */ new Set();
      this._hintPenalties = [];
      this._usedHintIndices = /* @__PURE__ */ new Set();
      this._multiStepIndex = 0;
      this._stepDecisions = [];
      this._errorCount = 0;
      this._correctAnswerCount = 0;
      this._stepCalcAccuracies = {};
      this._decisionStepAttempts = {};
      this._decisionStepSolvedFirstTry = {};
      this._calcAccuracy100 = 100;
      this._formulaAccuracy100 = 100;
      this._decisionScore100 = 100;
      this._awaitingJustification = false;
      this._justificationBonus = 0;
      this._selectionBonus = 0;
    }
    get calcAccuracy100() {
      return this._calcAccuracyAverage();
    }
    get decisionScore100() {
      return this._decisionScoreFirstTry();
    }
    /** True while a correct Selection pick is waiting on submitJustification(). */
    get isAwaitingJustification() {
      return this._awaitingJustification;
    }
    get stepNumber() {
      return this.stage.objective?.type === ObjectiveType.MULTI_STEP ? this._multiStepIndex + 1 : 1;
    }
    get stepCount() {
      return this.stage.objective?.type === ObjectiveType.MULTI_STEP ? (this.stage.objective.subObjectives ?? []).length : 1;
    }
    get justificationBonus() {
      return this._justificationBonus;
    }
    get selectionBonus() {
      return this._selectionBonus;
    }
    get correctAnswerCount() {
      return this._correctAnswerCount;
    }
    get stepDecisions() {
      return this._stepDecisions.map((decision) => decision ? { ...decision, selectedIds: [...decision.selectedIds] } : null);
    }
    isHintUsed(hintIndex) {
      return this._usedHintIndices.has(hintIndex);
    }
    /** The objective currently active — itself for simple stages, or the
     * current sub-step for a MultiStep (Master Engineer) stage. */
    get currentObjective() {
      const root = this.stage.objective;
      if (!root || root.type !== ObjectiveType.MULTI_STEP) return root;
      const subs = root.subObjectives ?? [];
      if (subs.length === 0) return root;
      const i = Math.min(Math.max(this._multiStepIndex, 0), subs.length - 1);
      return subs[i];
    }
    /** Call once per animation frame / timer tick with the elapsed delta in seconds. */
    tick(deltaSeconds) {
      if (this.isFinished) return;
      this.elapsedSeconds += deltaSeconds;
      const limit = this.stage.timeLimitSeconds ?? 0;
      if (limit > 0 && this.elapsedSeconds >= limit) {
        this._end(false, "Time expired");
      }
    }
    isParameterRevealed(key) {
      const param = this.stage.givenParameters.find((p) => p.key === key);
      return !!param && (!param.isHidden || this._revealedKeys.has(key));
    }
    /** Call when the player uses a measurement tool that reveals a hidden value. */
    revealParameter(key) {
      if (!this._revealedKeys.has(key)) {
        this._revealedKeys.add(key);
        this.dispatchEvent(new CustomEvent("parameterRevealed", { detail: key }));
      }
    }
    useHint(hintIndex) {
      const hints = this.stage.hints ?? [];
      if (this.isFinished || hintIndex < 0 || hintIndex >= hints.length || this._usedHintIndices.has(hintIndex)) return false;
      this._usedHintIndices.add(hintIndex);
      this.hintsUsed++;
      const penalty = Number(hints[hintIndex].scorePenalty);
      this._hintPenalties.push(Number.isFinite(penalty) ? penalty : 0);
      return true;
    }
    applyMistake(severity) {
      if (this.isFinished) return;
      const s = this.stage.scoring;
      const penalty = {
        [MistakeSeverity.MINOR]: s.minorMistakePenalty,
        [MistakeSeverity.WRONG_CHOICE]: s.wrongChoicePenalty,
        [MistakeSeverity.CRITICAL]: s.criticalMistakePenalty
      }[severity] ?? 0;
      this._errorCount++;
      this.health = Math.min(100, Math.max(0, this.health - penalty));
      this.dispatchEvent(new CustomEvent("healthChanged", { detail: this.health }));
      if (this.health <= 0) this._end(false, "System health depleted");
    }
    spendBudget(amountEuro) {
      this.budgetRemaining -= amountEuro;
    }
    /** Submit a numeric answer for the current Calculation (sub-)objective. */
    submitCalculation(value) {
      const target = this.currentObjective?.calculation;
      if (!target || this.isFinished || this._awaitingJustification) return false;
      const tolerance = target.tolerancePercent ?? 5;
      const percentError = target.expectedValue !== 0 ? Math.abs(value - target.expectedValue) / Math.abs(target.expectedValue) * 100 : Math.abs(value - target.expectedValue) * 100;
      let correct = percentError <= tolerance;
      if (!correct && Number.isFinite(target.expectedValue)) {
        const exp = target.expectedValue;
        for (let dec = 0; dec <= 4; dec++) {
          if (Math.abs(value - Number(exp.toFixed(dec))) < 1e-7) {
            correct = true;
            break;
          }
        }
        if (!correct) {
          for (let sig = 1; sig <= 4; sig++) {
            if (Math.abs(value - Number(exp.toPrecision(sig))) < 1e-7) {
              correct = true;
              break;
            }
          }
        }
        if (!correct && Math.abs(value - exp) <= 0.02) {
          correct = true;
        }
      }
      const accuracy = correct ? Math.min(100, Math.max(95, 100 - percentError)) : Math.max(0, 100 - percentError);
      this._stepCalcAccuracies[this._multiStepIndex] = accuracy;
      this._calcAccuracy100 = this._calcAccuracyAverage();
      this._stepDecisions[this._multiStepIndex] = {
        selectedIds: [String(value)],
        answer: value,
        correct
      };
      if (!correct) this.applyMistake(MistakeSeverity.MINOR);
      else {
        this._correctAnswerCount++;
        this._advanceOrEnd(true, "Calculation correct");
      }
      return correct;
    }
    /**
     * Submit a choice for the current Selection (sub-)objective (e.g. pump A/B/C).
     */
    selectOption(optionId) {
      const target = this.currentObjective?.selection;
      if (!target || this.isFinished || this._awaitingJustification) return false;
      const chosenOption = target.options?.find((o) => o.optionId === optionId);
      if (chosenOption?.costEuro) {
        this.spendBudget(chosenOption.costEuro);
      }
      const currentStepIdx = this._multiStepIndex;
      this._decisionStepAttempts[currentStepIdx] = (this._decisionStepAttempts[currentStepIdx] || 0) + 1;
      const correct = optionId === target.correctOptionId;
      if (correct && this._decisionStepAttempts[currentStepIdx] === 1) {
        this._decisionStepSolvedFirstTry[currentStepIdx] = true;
      }
      this._decisionScore100 = this._decisionScoreFirstTry();
      const formulaWeight = this.stage.scoring.correctFormulaWeight ?? 0;
      if (target.scoreAsFormula === true) {
        this._formulaAccuracy100 = correct ? 100 : 0;
      }
      this._stepDecisions[this._multiStepIndex] = { selectedIds: [optionId], correct };
      if (!correct) {
        this.applyMistake(MistakeSeverity.WRONG_CHOICE);
        return correct;
      }
      if (target.justification) {
        this._awaitingJustification = true;
        this.dispatchEvent(new CustomEvent("awaitingJustification", { detail: target.justification }));
      } else {
        this._correctAnswerCount++;
        this._advanceOrEnd(true, "Correct selection");
      }
      return correct;
    }
    /** Submit a checkbox selection for a multi-answer Selection objective. */
    submitMultipleSelection(optionIds) {
      const target = this.currentObjective?.selection;
      if (!target || target.mode !== "multiple" || this.isFinished || this._awaitingJustification) return null;
      if (!Array.isArray(optionIds) || optionIds.length === 0) return null;
      const validIds = new Set((target.options ?? []).map((option) => option.optionId));
      const chosenIds = [...new Set(optionIds)].filter((id) => validIds.has(id));
      if (chosenIds.length === 0) return null;
      const currentStepIdx = this._multiStepIndex;
      this._decisionStepAttempts[currentStepIdx] = (this._decisionStepAttempts[currentStepIdx] || 0) + 1;
      const correctIds = target.correctOptionIds ?? [];
      const correctChosen = chosenIds.filter((id) => correctIds.includes(id));
      const wrongChosen = chosenIds.filter((id) => !correctIds.includes(id));
      const missedCorrect = correctIds.filter((id) => !chosenIds.includes(id));
      const formulaDenominator = correctIds.length + wrongChosen.length;
      const proportion = formulaDenominator > 0 ? correctChosen.length / formulaDenominator : 0;
      const isFullyCorrect = missedCorrect.length === 0 && wrongChosen.length === 0;
      if (isFullyCorrect && this._decisionStepAttempts[currentStepIdx] === 1) {
        this._decisionStepSolvedFirstTry[currentStepIdx] = true;
      }
      const formulaWeight = this.stage.scoring.correctFormulaWeight ?? 0;
      if (target.scoreAsFormula === true) {
        this._formulaAccuracy100 = Math.round(proportion * 100);
      }
      if (target.scoreAsFormula !== true || formulaWeight === 0) {
        this._decisionScore100 = this._decisionScoreFirstTry();
      }
      if (wrongChosen.length > 0 || missedCorrect.length > 0) this.applyMistake(MistakeSeverity.WRONG_CHOICE);
      this._awaitingJustification = true;
      const outcome = {
        correctChosen,
        wrongChosen,
        missedCorrect,
        isFullyCorrect,
        feedback: target.feedback ?? {}
      };
      const selectionBonus = outcome.isFullyCorrect ? target.scoring?.fullBonus ?? 0 : 0;
      this._selectionBonus += selectionBonus;
      this._stepDecisions[this._multiStepIndex] = {
        selectedIds: chosenIds,
        correct: outcome.isFullyCorrect,
        bonus: selectionBonus
      };
      outcome.selectionBonus = selectionBonus;
      this.dispatchEvent(new CustomEvent("awaitingJustification", { detail: target.justification }));
      return outcome;
    }
    /**
     * Submit the set of factor ids the player chose to justify their correct
     * pick.
     */
    submitJustification(chosenFactorIds) {
      const target = this.currentObjective?.selection;
      const justification = target?.justification;
      if (!justification || !this._awaitingJustification || this.isFinished) return null;
      if (!Array.isArray(chosenFactorIds) || chosenFactorIds.length === 0) return null;
      const factors = justification.factors ?? [];
      const correctIds = factors.filter((f) => f.correct).map((f) => f.factorId);
      const incorrectIds = factors.filter((f) => !f.correct).map((f) => f.factorId);
      const correctChosen = chosenFactorIds.filter((id) => correctIds.includes(id));
      const wrongChosen = chosenFactorIds.filter((id) => incorrectIds.includes(id));
      const missedCorrect = correctIds.filter((id) => !chosenFactorIds.includes(id));
      const scoring = justification.scoring ?? {};
      const fullBonus = scoring.fullBonus ?? 10;
      const perWrongPenalty = scoring.wrongFactorPenalty ?? 2;
      const maxWrongPenalty = scoring.maxWrongPenalty ?? 6;
      const justDenominator = correctIds.length + wrongChosen.length;
      const proportion = justDenominator > 0 ? correctChosen.length / justDenominator : 0;
      const bonus = proportion * fullBonus;
      const penalty = Math.min(wrongChosen.length * perWrongPenalty, maxWrongPenalty);
      const netDelta = bonus - penalty;
      this._justificationBonus += netDelta;
      const outcome = {
        correctChosen,
        wrongChosen,
        missedCorrect,
        bonus,
        penalty,
        netDelta,
        isFullyCorrect: missedCorrect.length === 0 && wrongChosen.length === 0,
        feedback: justification.feedback ?? {},
        selectionBonus: this._stepDecisions[this._multiStepIndex]?.bonus ?? 0
      };
      this._awaitingJustification = false;
      if (this._stepDecisions[this._multiStepIndex]?.correct) this._correctAnswerCount++;
      this._advanceOrEnd(true, "Correct selection with justification", outcome);
      return outcome;
    }
    /** Submit a hypothesis id for the current Diagnosis (sub-)objective. */
    submitDiagnosis(hypothesisId) {
      const target = this.currentObjective?.diagnosis;
      if (!target || this.isFinished || this._awaitingJustification) return false;
      const currentStepIdx = this._multiStepIndex;
      this._decisionStepAttempts[currentStepIdx] = (this._decisionStepAttempts[currentStepIdx] || 0) + 1;
      const match = target.hypotheses.find((h) => h.hypothesisId === hypothesisId);
      const correct = !!match?.isCorrect;
      if (correct && this._decisionStepAttempts[currentStepIdx] === 1) {
        this._decisionStepSolvedFirstTry[currentStepIdx] = true;
      }
      this._decisionScore100 = this._decisionScoreFirstTry();
      if (!correct) this.applyMistake(MistakeSeverity.WRONG_CHOICE);
      else {
        this._correctAnswerCount++;
        this._advanceOrEnd(true, "Correct diagnosis");
      }
      return correct;
    }
    _getCalculationStepIndices() {
      const root = this.stage.objective;
      if (!root) return [];
      if (root.type === ObjectiveType.CALCULATION) return [0];
      if (root.type === ObjectiveType.MULTI_STEP) {
        const indices = [];
        (root.subObjectives ?? []).forEach((sub, i) => {
          if (sub.type === ObjectiveType.CALCULATION) indices.push(i);
        });
        return indices;
      }
      return [];
    }
    _calcAccuracyAverage() {
      const calcIndices = this._getCalculationStepIndices();
      if (calcIndices.length === 0) return 100;
      const sum = calcIndices.reduce((acc, idx) => acc + (this._stepCalcAccuracies[idx] ?? 0), 0);
      return Math.round(sum / calcIndices.length);
    }
    _getDecisionStepIndices() {
      const root = this.stage.objective;
      if (!root) return [];
      if (root.type === ObjectiveType.SELECTION || root.type === ObjectiveType.DIAGNOSIS) return [0];
      if (root.type === ObjectiveType.MULTI_STEP) {
        const indices = [];
        (root.subObjectives ?? []).forEach((sub, i) => {
          if (sub.type === ObjectiveType.SELECTION || sub.type === ObjectiveType.DIAGNOSIS) indices.push(i);
        });
        return indices;
      }
      return [];
    }
    _decisionScoreFirstTry() {
      const decIndices = this._getDecisionStepIndices();
      if (decIndices.length === 0) return 100;
      const solvedFirstTry = decIndices.filter((idx) => this._decisionStepSolvedFirstTry[idx] === true).length;
      return Math.round(solvedFirstTry / decIndices.length * 100);
    }
    _advanceOrEnd(success, reason, justificationOutcome = null) {
      const root = this.stage.objective;
      if (root?.type === ObjectiveType.MULTI_STEP && this._multiStepIndex < root.subObjectives.length - 1) {
        const completedStepIndex = this._multiStepIndex;
        const completedObjective = root.subObjectives[completedStepIndex];
        this._multiStepIndex++;
        this.dispatchEvent(new CustomEvent("objectiveAdvanced", {
          detail: {
            completedStepIndex,
            nextStepIndex: this._multiStepIndex,
            totalSteps: root.subObjectives.length,
            completedObjective,
            justificationOutcome
          }
        }));
        return;
      }
      this._end(success, reason);
    }
    _end(success, reason) {
      if (this.isFinished) return;
      this.isFinished = true;
      const hintPenalty = this._hintPenalties.reduce((a, b) => a + b, 0);
      const s = this.stage.scoring || {};
      const calcAccuracy = this._calcAccuracyAverage();
      const decisionScore = this._decisionScoreFirstTry();
      this._calcAccuracy100 = calcAccuracy;
      this._decisionScore100 = decisionScore;
      const weighted = (Number.isFinite(s.calculationAccuracyWeight) ? s.calculationAccuracyWeight : 0) * calcAccuracy / 100 + (Number.isFinite(s.solveSpeedWeight) ? s.solveSpeedWeight : 0) * this._speedScore100() / 100 + (Number.isFinite(s.errorCountWeight) ? s.errorCountWeight : 0) * Math.max(0, 100 - this._errorCount * 10) / 100 + (Number.isFinite(s.engineeringDecisionsWeight) ? s.engineeringDecisionsWeight : 0) * decisionScore / 100 + (Number.isFinite(s.correctFormulaWeight) ? s.correctFormulaWeight : 0) * this._formulaAccuracy100 / 100;
      const totalSteps = this.stepCount;
      const completedSteps = success ? totalSteps : this._correctAnswerCount;
      const completionRatio = totalSteps > 0 ? Math.min(1, completedSteps / totalSteps) : success ? 1 : 0;
      let rawScore = Math.max(0, weighted);
      let finalScore = rawScore;
      if (!success) {
        finalScore = rawScore * completionRatio;
      }
      finalScore = Math.round(finalScore) - hintPenalty + Math.round(this._justificationBonus + this._selectionBonus);
      finalScore = Math.min(100, Math.max(0, finalScore));
      if (!Number.isFinite(finalScore)) finalScore = 0;
      this.dispatchEvent(
        new CustomEvent("stageEnded", {
          detail: {
            success,
            reason,
            finalScore,
            // P0-#1: Never expose rank on failure — display '—' in the UI.
            rank: success ? this._rankFor(finalScore) : null,
            justificationBonus: this._justificationBonus,
            selectionBonus: this._selectionBonus,
            correctCount: this._correctAnswerCount,
            completedSteps,
            totalSteps,
            elapsedSeconds: this.elapsedSeconds,
            debriefArabic: success ? this.stage.debriefSuccessArabic : this.stage.debriefFailureArabic
          }
        })
      );
    }
    _speedScore100() {
      const limit = this.stage.timeLimitSeconds ?? 0;
      if (limit <= 0) return 100;
      return Math.min(1, Math.max(0, 1 - this.elapsedSeconds / limit)) * 100;
    }
    _rankFor(score) {
      if (score >= 90) return EngineeringRank.MASTER_ENGINEER;
      if (score >= 80) return EngineeringRank.SENIOR_ENGINEER;
      if (score >= 70) return EngineeringRank.HYDRAULIC_ENGINEER;
      if (score >= 60) return EngineeringRank.JUNIOR_ENGINEER;
      return EngineeringRank.EMERGENCY_TRAINING_REQUIRED;
    }
    // ---------------------------------------------------------------------
    // Extension point: wire this to your actual hydraulic simulation/renderer.
    // stage.network only holds plain data (ids, lengths, diameters) so it's
    // reusable regardless of how you render/simulate it — SVG, Canvas, etc.
    // ---------------------------------------------------------------------
    // buildNetwork() { ... }
  };

  // js/network-renderer.js
  var SVG_NS = "http://www.w3.org/2000/svg";
  var VIEWBOX_W = 800;
  var VIEWBOX_H = 480;
  var MARGIN = 70;
  var NODE_RADIUS = 22;
  var NetworkRenderer = class extends EventTarget {
    /**
     * @param {HTMLElement} container
     * @param {{nodes: any[], pipes: any[]}} network
     */
    constructor(container, network) {
      super();
      this.container = container;
      this.network = network ?? { nodes: [], pipes: [] };
      this._pipeStatus = /* @__PURE__ */ new Map();
      this._pipeReversed = /* @__PURE__ */ new Map();
      this._selected = null;
      this._nodePositions = /* @__PURE__ */ new Map();
      this._pipeEls = /* @__PURE__ */ new Map();
      this._nodeEls = /* @__PURE__ */ new Map();
      this._view = { x: 0, y: 0, scale: 1 };
      this._drag = null;
      this._didPan = false;
      this._computeLayout();
      this._buildSvg();
    }
    // -- Public API -----------------------------------------------------------
    /** @param {string} pipeId @param {'normal'|'broken'|'closed'} status */
    setPipeStatus(pipeId, status) {
      this._pipeStatus.set(pipeId, status);
      this._applyPipeStatus(pipeId);
    }
    getPipeStatus(pipeId) {
      return this._pipeStatus.get(pipeId) ?? "normal";
    }
    /** @param {string} pipeId @param {boolean} reversed */
    setFlowReversed(pipeId, reversed) {
      this._pipeReversed.set(pipeId, !!reversed);
      this._applyPipeDirection(pipeId);
    }
    clearSelection() {
      this._setSelected(null);
    }
    zoomIn() {
      this._zoom(1.18);
    }
    zoomOut() {
      this._zoom(1 / 1.18);
    }
    resetView() {
      this._view = { x: 0, y: 0, scale: 1 };
      this._applyView();
    }
    /** Removes the SVG. Call before discarding this renderer. */
    destroy() {
      this.container.innerHTML = "";
    }
    // -- Layout -----------------------------------------------------------------
    _computeLayout() {
      const nodes = this.network.nodes ?? [];
      if (nodes.length === 0) return;
      const elevations = nodes.map((n) => n.elevationMeters ?? 0);
      const minEl = Math.min(...elevations);
      const maxEl = Math.max(...elevations);
      const range = maxEl - minEl || 1;
      const drawW = VIEWBOX_W - MARGIN * 2;
      const drawH = VIEWBOX_H - MARGIN * 2;
      nodes.forEach((node, i) => {
        const xFrac = typeof node.x === "number" ? node.x : nodes.length > 1 ? i / (nodes.length - 1) : 0.5;
        const elevation = node.elevationMeters ?? 0;
        const yFrac = typeof node.y === "number" ? node.y : 1 - (elevation - minEl) / range;
        this._nodePositions.set(node.nodeId, {
          x: MARGIN + xFrac * drawW,
          y: MARGIN + yFrac * drawH
        });
      });
    }
    // -- SVG construction ---------------------------------------------------------
    _buildSvg() {
      this.container.innerHTML = "";
      this.container.classList.add("network-renderer");
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("viewBox", `0 0 ${VIEWBOX_W} ${VIEWBOX_H}`);
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.classList.add("network-svg");
      svg.appendChild(this._buildDefs());
      const bg = document.createElementNS(SVG_NS, "rect");
      bg.setAttribute("x", "0");
      bg.setAttribute("y", "0");
      bg.setAttribute("width", String(VIEWBOX_W));
      bg.setAttribute("height", String(VIEWBOX_H));
      bg.setAttribute("class", "network-bg");
      bg.addEventListener("click", () => this.clearSelection());
      svg.appendChild(bg);
      this._viewport = document.createElementNS(SVG_NS, "g");
      this._viewport.setAttribute("class", "network-viewport");
      const pipesLayer = document.createElementNS(SVG_NS, "g");
      const nodesLayer = document.createElementNS(SVG_NS, "g");
      this._viewport.append(pipesLayer, nodesLayer);
      svg.appendChild(this._viewport);
      (this.network.pipes ?? []).forEach((pipe) => this._buildPipe(pipe, pipesLayer));
      (this.network.nodes ?? []).forEach((node) => this._buildNode(node, nodesLayer));
      this.container.appendChild(svg);
      this._buildControls();
      svg.addEventListener("wheel", (event) => {
        event.preventDefault();
        this._zoom(event.deltaY < 0 ? 1.12 : 1 / 1.12);
      }, { passive: false });
      svg.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        this._drag = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, x: this._view.x, y: this._view.y };
        this._didPan = false;
        svg.setPointerCapture(event.pointerId);
      });
      svg.addEventListener("pointermove", (event) => {
        if (!this._drag || this._drag.pointerId !== event.pointerId) return;
        const dx = event.clientX - this._drag.clientX;
        const dy = event.clientY - this._drag.clientY;
        if (Math.abs(dx) + Math.abs(dy) > 5) this._didPan = true;
        if (this._didPan) {
          const rect = svg.getBoundingClientRect();
          this._view.x = this._drag.x + dx * VIEWBOX_W / Math.max(rect.width, 1);
          this._view.y = this._drag.y + dy * VIEWBOX_H / Math.max(rect.height, 1);
          this._applyView();
        }
      });
      const endDrag = (event) => {
        if (this._drag?.pointerId !== event.pointerId) return;
        this._drag = null;
        if (this._didPan) window.setTimeout(() => {
          this._didPan = false;
        }, 0);
      };
      svg.addEventListener("pointerup", endDrag);
      svg.addEventListener("pointercancel", endDrag);
    }
    _buildControls() {
      const controls = document.createElement("div");
      controls.className = "map-controls";
      controls.innerHTML = `<button type="button" data-map="in" aria-label="${t("zoomIn")}" title="${t("zoomIn")}">+</button><button type="button" data-map="out" aria-label="${t("zoomOut")}" title="${t("zoomOut")}">\u2212</button><button type="button" data-map="reset" aria-label="${t("resetMap")}" title="${t("resetMap")}">\u2302</button>`;
      controls.querySelector('[data-map="in"]').addEventListener("click", () => this.zoomIn());
      controls.querySelector('[data-map="out"]').addEventListener("click", () => this.zoomOut());
      controls.querySelector('[data-map="reset"]').addEventListener("click", () => this.resetView());
      this.container.appendChild(controls);
    }
    _zoom(factor) {
      const next = Math.min(2.8, Math.max(0.75, this._view.scale * factor));
      const ratio = next / this._view.scale;
      this._view.x = VIEWBOX_W / 2 - (VIEWBOX_W / 2 - this._view.x) * ratio;
      this._view.y = VIEWBOX_H / 2 - (VIEWBOX_H / 2 - this._view.y) * ratio;
      this._view.scale = next;
      this._applyView();
    }
    _applyView() {
      this._viewport?.setAttribute("transform", `translate(${this._view.x} ${this._view.y}) scale(${this._view.scale})`);
    }
    _buildDefs() {
      const defs = document.createElementNS(SVG_NS, "defs");
      const marker = document.createElementNS(SVG_NS, "marker");
      marker.setAttribute("id", "flow-arrow");
      marker.setAttribute("markerWidth", "8");
      marker.setAttribute("markerHeight", "8");
      marker.setAttribute("refX", "5");
      marker.setAttribute("refY", "3");
      marker.setAttribute("orient", "auto");
      marker.setAttribute("markerUnits", "strokeWidth");
      const arrow = document.createElementNS(SVG_NS, "path");
      arrow.setAttribute("d", "M0,0 L6,3 L0,6 Z");
      arrow.setAttribute("class", "flow-arrow-head");
      marker.appendChild(arrow);
      defs.appendChild(marker);
      return defs;
    }
    _buildPipe(pipe, layer) {
      const from = this._nodePositions.get(pipe.fromNodeId);
      const to = this._nodePositions.get(pipe.toNodeId);
      if (!from || !to) {
        console.warn(`[network-renderer] pipe '${pipe.pipeId}' references a missing node.`);
        return;
      }
      const group = document.createElementNS(SVG_NS, "g");
      group.setAttribute("class", "pipe");
      group.setAttribute("tabindex", "0");
      group.setAttribute("role", "button");
      group.setAttribute("aria-label", `\u0623\u0646\u0628\u0648\u0628 ${pipe.pipeId}`);
      const hit = document.createElementNS(SVG_NS, "line");
      hit.setAttribute("class", "pipe-hit");
      hit.setAttribute("x1", from.x);
      hit.setAttribute("y1", from.y);
      hit.setAttribute("x2", to.x);
      hit.setAttribute("y2", to.y);
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("marker-end", "url(#flow-arrow)");
      const title = document.createElementNS(SVG_NS, "title");
      title.textContent = `${pipe.pipeId} \u2014 ${pipe.lengthMeters} m\u060C \xD8${pipe.diameterMm} mm`;
      group.append(hit, line, title);
      const select = () => {
        if (!this._didPan) this._setSelected({ type: "pipe", id: pipe.pipeId, data: pipe });
      };
      group.addEventListener("click", select);
      group.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
        }
      });
      layer.appendChild(group);
      this._pipeEls.set(pipe.pipeId, { group, line, from, to });
      this._applyPipeStatus(pipe.pipeId);
      this._applyPipeDirection(pipe.pipeId);
    }
    _buildNode(node, layer) {
      const pos = this._nodePositions.get(node.nodeId);
      if (!pos) return;
      const group = document.createElementNS(SVG_NS, "g");
      group.setAttribute("class", `node node--${node.kind}`);
      group.setAttribute("transform", `translate(${pos.x}, ${pos.y})`);
      group.setAttribute("tabindex", "0");
      group.setAttribute("role", "button");
      group.setAttribute("aria-label", node.nodeId);
      const shape = document.createElementNS(SVG_NS, "circle");
      shape.setAttribute("class", "node-shape");
      shape.setAttribute("r", String(NODE_RADIUS));
      const label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("class", "node-label");
      label.setAttribute("y", String(NODE_RADIUS + 16));
      label.textContent = node.nodeId;
      const icon = document.createElementNS(SVG_NS, "text");
      icon.setAttribute("class", "node-icon");
      icon.setAttribute("text-anchor", "middle");
      icon.setAttribute("y", "5");
      icon.textContent = { reservoir: "\u224B", tank: "\u25B1", pumpStation: "\u25C9", junction: "\u2022", consumer: "\u2302" }[node.kind] ?? "\u25CF";
      const elevationLabel = document.createElementNS(SVG_NS, "text");
      elevationLabel.setAttribute("class", "node-elevation");
      elevationLabel.setAttribute("y", "4");
      elevationLabel.textContent = node.elevationMeters !== void 0 ? `${node.elevationMeters}m` : "";
      const title = document.createElementNS(SVG_NS, "title");
      title.textContent = `${node.nodeId} (${node.kind}) \u2014 ${node.elevationMeters} m`;
      group.append(shape, icon, label, elevationLabel, title);
      const select = () => {
        if (!this._didPan) this._setSelected({ type: "node", id: node.nodeId, data: node });
      };
      group.addEventListener("click", select);
      group.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
        }
      });
      layer.appendChild(group);
      this._nodeEls.set(node.nodeId, { group, shape });
    }
    // -- Live state updates ---------------------------------------------------------
    _applyPipeStatus(pipeId) {
      const el = this._pipeEls.get(pipeId);
      if (!el) return;
      const status = this.getPipeStatus(pipeId);
      el.line.setAttribute("class", `pipe-line pipe-line--${status}`);
    }
    _applyPipeDirection(pipeId) {
      const el = this._pipeEls.get(pipeId);
      if (!el) return;
      const reversed = this._pipeReversed.get(pipeId) ?? false;
      const { from, to } = el;
      const [x1, y1, x2, y2] = reversed ? [to.x, to.y, from.x, from.y] : [from.x, from.y, to.x, to.y];
      el.line.setAttribute("x1", x1);
      el.line.setAttribute("y1", y1);
      el.line.setAttribute("x2", x2);
      el.line.setAttribute("y2", y2);
    }
    _setSelected(selection) {
      if (this._selected) {
        const prev = this._selected.type === "pipe" ? this._pipeEls.get(this._selected.id)?.group : this._nodeEls.get(this._selected.id)?.group;
        prev?.classList.remove("is-selected");
      }
      this._selected = selection;
      if (selection) playSelectSound();
      if (selection) {
        const cur = selection.type === "pipe" ? this._pipeEls.get(selection.id)?.group : this._nodeEls.get(selection.id)?.group;
        cur?.classList.add("is-selected");
      }
      this.dispatchEvent(new CustomEvent("elementSelected", { detail: selection }));
    }
  };

  // js/ui/hud.js
  function renderHud(container, session, { onExit, studentName = "", stages = [], activeMission: activeMission2 = false } = {}) {
    container.innerHTML = `
    <div class="hud">
      <button class="hud-exit" data-action="exit" title="${t("back")}" aria-label="${t("back")}">\u293A</button>
      <div class="hud-item">
        <span class="hud-label">${t("timeRemaining")}</span>
        <span class="hud-value readout" data-field="timer">--:--</span>
      </div>
      <div class="hud-item hud-health">
        <span class="hud-label">${t("health")}</span>
        <div class="hud-bar"><div class="hud-bar-fill" data-field="healthBar"></div></div>
        <span class="hud-value readout" data-field="healthText">100%</span>
      </div>
      <div class="hud-item">
        <span class="hud-label">${t("budget")}</span>
        <span class="hud-value readout" data-field="budget">\u2014</span>
      </div>
    </div>
  `;
    if (onExit) {
      container.querySelector('[data-action="exit"]').addEventListener("click", onExit);
    }
    mountPlayerDrawer(container, { studentName, stages, currentStage: session.stage, activeMission: activeMission2 });
    const timerEl = container.querySelector('[data-field="timer"]');
    const healthBarEl = container.querySelector('[data-field="healthBar"]');
    const healthTextEl = container.querySelector('[data-field="healthText"]');
    const budgetEl = container.querySelector('[data-field="budget"]');
    function updateTimer() {
      const limit = session.stage.timeLimitSeconds ?? 0;
      if (limit <= 0) {
        timerEl.textContent = "--:--";
        return;
      }
      const remaining = Math.max(0, limit - session.elapsedSeconds);
      const m = Math.floor(remaining / 60).toString().padStart(2, "0");
      const s = Math.floor(remaining % 60).toString().padStart(2, "0");
      timerEl.textContent = `${m}:${s}`;
    }
    function updateHealth(health) {
      healthBarEl.style.width = `${health}%`;
      healthTextEl.textContent = `${Math.round(health)}%`;
      healthBarEl.classList.toggle("hud-bar-fill--low", health <= 30);
    }
    function updateBudget() {
      const hasBudget = (session.stage.budgetEuro ?? 0) > 0;
      budgetEl.textContent = hasBudget ? `${Math.round(session.budgetRemaining).toLocaleString("ar")} \u20AC` : "\u2014";
    }
    session.addEventListener("healthChanged", (e) => updateHealth(e.detail));
    updateHealth(session.health);
    updateBudget();
    return {
      tick() {
        updateTimer();
        updateBudget();
      }
    };
  }

  // js/ui/notifications.js
  function showFeedbackToast(container, { correct, message = "", detail = "", delta = null }) {
    const target = document.body;
    document.querySelectorAll(".feedback-toast").forEach((existing) => existing.remove());
    const toast = document.createElement("section");
    toast.className = `feedback-toast feedback-toast--${correct ? "success" : "error"}`;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    const deltaText = delta === null ? "" : `<span class="toast-delta">${delta > 0 ? "+" : ""}${delta} ${t("score")}</span>`;
    toast.innerHTML = `<div class="toast-icon" aria-hidden="true">${correct ? "\u2713" : "!"}</div><div class="toast-copy"><strong>${correct ? t("success") : t("wrong")}</strong><p>${escapeHtml4(message || (correct ? t("earned") : t("missed")))}</p>${detail ? `<small>${escapeHtml4(detail)}</small>` : ""}</div>${deltaText}<button type="button" class="toast-close" aria-label="${t("closeToast")}">\xD7</button>`;
    target.appendChild(toast);
    toast.querySelector(".toast-close").addEventListener("click", () => toast.remove());
    window.setTimeout(() => toast.remove(), 4200);
    if (correct) playSuccessSound();
    else playErrorSound();
  }
  function escapeHtml4(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  // js/ui/stage-screen.js
  function renderStageScreen(container, stage, { onExit, onStageEnded, studentName = "", stages = [] } = {}) {
    const effectiveStage = getSettings().extraTime && stage.timeLimitSeconds > 0 ? { ...stage, timeLimitSeconds: stage.timeLimitSeconds * 2 } : stage;
    const session = new StageSession(effectiveStage);
    let errorCount = 0;
    session.addEventListener("healthChanged", () => {
      errorCount++;
    });
    container.innerHTML = `
    <div class="stage-screen">
      <div class="stage-hud" data-region="hud"></div>
      <div class="stage-tools panel" data-region="tools"></div>
      <div class="stage-network" data-region="network"></div>
      <div class="stage-briefing panel" data-region="briefing"></div>
      <div class="stage-panel panel" data-region="panel"></div>
    </div>
  `;
    const hudEl = container.querySelector('[data-region="hud"]');
    const briefingEl = container.querySelector('[data-region="briefing"]');
    const networkEl = container.querySelector('[data-region="network"]');
    const toolsEl = container.querySelector('[data-region="tools"]');
    const panelEl = container.querySelector('[data-region="panel"]');
    renderBriefing(briefingEl, stage, session);
    renderTools(toolsEl, stage);
    const renderer = new NetworkRenderer(networkEl, stage.network);
    renderer.addEventListener("elementSelected", (e) => highlightSelection(toolsEl, e.detail));
    const hud = renderHud(hudEl, session, { onExit, studentName, stages, activeMission: true });
    renderObjectivePanel(panelEl, session);
    session.addEventListener("objectiveAdvanced", (e) => renderStepAdvance(panelEl, session, e.detail));
    session.addEventListener("stageEnded", (e) => {
      if (!onStageEnded) {
        renderDebrief(panelEl, e.detail);
        return;
      }
      const budgetUsed = (stage.budgetEuro ?? 0) - session.budgetRemaining;
      const timeRemaining = stage.timeLimitSeconds > 0 ? Math.max(0, stage.timeLimitSeconds - session.elapsedSeconds) : null;
      onStageEnded({ ...e.detail, errorCount, budgetUsed, timeRemaining });
    });
    let lastTime = performance.now();
    function loop(now) {
      if (!panelEl.isConnected) return;
      const rawDt = (now - lastTime) / 1e3;
      const dt = Math.min(rawDt, 1);
      lastTime = now;
      session.tick(dt);
      hud.tick();
      if (!session.isFinished) requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    return session;
  }
  function renderBriefing(el, stage, session) {
    const rows = (stage.givenParameters ?? []).map((p) => {
      const revealed = !p.isHidden || session.isParameterRevealed(p.key);
      const value = revealed ? `${p.value} ${p.unit}` : "\u061F";
      return `<li><span>${p.displayNameArabic}</span><span class="param-value${revealed ? "" : " param-value--hidden"}">${value}</span></li>`;
    }).join("");
    el.innerHTML = `
    <p class="eyebrow">${stage.stageId} \xB7 ${t("stage")} ${stage.stageIndexInLevel ?? ""}</p>
    <h2 class="panel-title">${getLanguage() === "en" ? stage.learning?.titleEn ?? stage.titleArabic : stage.titleArabic}</h2>
    <p>${stage.briefingArabic}</p>
    ${getLanguage() === "en" ? `<p class="translation-notice">${t("arabicStageNotice")}</p>` : ""}
    ${stage.learning ? `<div class="stage-learning-strip"><span>${t("difficulty")}: ${stage.learning.difficulty}</span><span>${t("learningLevel")}: ${t(`level${capitalize(stage.learning.academicLevel)}`)}</span><span>${t("outcome")}: ${stage.learning.outcome?.[getLanguage()] ?? stage.learning.outcome?.ar ?? ""}</span></div>` : ""}
    <h3 class="panel-title">${getLanguage() === "ar" ? "\u0627\u0644\u0645\u0639\u0637\u064A\u0627\u062A" : "Parameters"}</h3>
    <ul class="param-list">${rows}</ul>
  `;
  }
  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function renderTools(el, stage) {
    const items = (stage.availableTools ?? []).map((toolKey) => `<li><span>${t(toolKey) !== toolKey ? t(toolKey) : toolKey}</span></li>`).join("");
    el.innerHTML = `
    <h3 class="panel-title">${getLanguage() === "ar" ? "\u0627\u0644\u0623\u062F\u0648\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u062D\u0629" : "Available tools"}</h3>
    <ul class="tool-list">${items || `<li><span>${t("none")}</span></li>`}</ul>
    <div data-role="selection"></div>
  `;
  }
  function highlightSelection(toolsEl, selection) {
    const box = toolsEl.querySelector('[data-role="selection"]');
    if (!box) return;
    if (!selection) {
      box.innerHTML = "";
      return;
    }
    const label = selection.type === "pipe" ? `${t("selectedPipe")}: ${selection.id}` : `${t("selectedNode")}: ${selection.id}`;
    box.innerHTML = `<p class="panel-title">${label}</p>`;
  }
  function renderObjectivePanel(panelEl, session) {
    const obj = session.currentObjective;
    if (!obj) {
      panelEl.innerHTML = `<p>${t("noObjective")}</p>`;
      return;
    }
    if (obj.type === ObjectiveType.SELECTION) {
      renderSelectionObjective(panelEl, session, obj.selection);
    } else if (obj.type === ObjectiveType.CALCULATION) {
      renderCalculationObjective(panelEl, session, obj.calculation);
    } else if (obj.type === ObjectiveType.DIAGNOSIS) {
      renderDiagnosisObjective(panelEl, session, obj.diagnosis);
    } else {
      panelEl.innerHTML = `<p>${t("unsupportedObjective")} (${obj.type})</p>`;
    }
    if (session.stepCount > 1) {
      const header = document.createElement("div");
      header.className = "step-heading";
      header.innerHTML = `
      <span class="step-counter">${t("part")} ${session.stepNumber} / ${session.stepCount}</span>
      <h3>${obj.stepTitleArabic ?? t("diagnosticStep")}</h3>
      ${obj.instructionArabic ? `<p>${obj.instructionArabic}</p>` : ""}
    `;
      panelEl.prepend(header);
    }
    if (session.stepCount > 1 && session.stepNumber === session.stepCount) {
      const summary = document.createElement("section");
      summary.className = "investigation-summary";
      summary.innerHTML = renderInvestigationSummary(session);
      const header = panelEl.querySelector(".step-heading");
      panelEl.insertBefore(summary, header?.nextSibling ?? panelEl.firstChild);
    }
    renderHints(panelEl, session);
  }
  function renderInvestigationSummary(session) {
    const objectives = session.stage.objective.subObjectives.slice(0, session.stepNumber - 1);
    return `
    <h3 class="panel-title">${t("investigationSummary")}</h3>
    <ol class="investigation-list">
      ${objectives.map((objective, index) => {
      const decision = session.stepDecisions[index];
      const selection = objective.selection;
      const options = selection?.options ?? [];
      const selectedLabels = decision?.answer !== void 0 ? [`${objective.calculation?.targetParameterKey ?? (getLanguage() === "ar" ? "\u0646\u062A\u064A\u062C\u0629 \u0627\u0644\u062D\u0633\u0627\u0628" : "Calculated result")} = ${decision.answer}`] : (decision?.selectedIds ?? []).map((id) => {
        const option = options.find((item) => item.optionId === id);
        return option?.displayName ?? option?.labelArabic ?? id;
      });
      const status = decision?.correct ? t("choicesMatchEvidence") : t("choicesNeedReview");
      return `<li>
          <strong>${objective.stepTitleArabic ?? `${t("part")} ${index + 1}`}</strong>
          <span>${selectedLabels.length ? selectedLabels.join("\u060C ") : getLanguage() === "ar" ? "\u0644\u0645 \u062A\u0633\u062C\u0644 \u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A" : "No selections recorded"}</span>
          <small>${status}</small>
        </li>`;
    }).join("")}
    </ol>
    <p class="summary-note">${t("summaryNote")}</p>
  `;
  }
  function renderSelectionObjective(panelEl, session, selection) {
    if (selection.mode === "multiple") {
      renderMultipleSelectionObjective(panelEl, session, selection);
      return;
    }
    const displayOptions = selection.shuffle === false ? selection.options : shuffleArray(selection.options);
    panelEl.innerHTML = `
    <h3 class="panel-title">${selection.promptArabic ?? t("chooseOption")}</h3>
    <div class="option-grid">
      ${displayOptions.map(
      (o) => `
        <button class="option-card" data-option="${o.optionId}">
          <strong>${o.displayName ?? o.labelArabic ?? o.optionId}</strong>
          ${o.specs?.length ? `<ul>${o.specs.map((s) => `<li><span>${s.displayNameArabic}</span><span>${s.value} ${s.unit}</span></li>`).join("")}</ul>` : ""}
          ${o.costEuro ? `<div class="option-cost">\u20AC ${o.costEuro.toLocaleString(getLanguage() === "ar" ? "ar" : "en")}</div>` : ""}
        </button>`
    ).join("")}
    </div>
    <div data-role="decision-feedback" aria-live="polite"></div>
    <div data-role="justification"></div>
    <div data-role="hints"></div>
  `;
    panelEl.querySelectorAll("[data-option]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const correct = session.selectOption(btn.dataset.option);
        if (session.isFinished) return;
        if (!correct) {
          btn.classList.add("option-card--wrong");
          const feedback2 = panelEl.querySelector('[data-role="decision-feedback"]');
          feedback2.innerHTML = `<p class="hint-text">${selection.options.find((o) => o.optionId === btn.dataset.option)?.feedbackArabic ?? "\u0647\u0630\u0627 \u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631 \u0644\u0627 \u064A\u0641\u0633\u0631 \u0627\u0644\u0645\u0639\u0637\u064A\u0627\u062A \u0627\u0644\u062D\u0627\u0644\u064A\u0629. \u0631\u0627\u062C\u0639 \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062A \u0648\u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649."}</p>`;
          showFeedbackToast(panelEl, { correct: false, message: getLanguage() === "ar" ? "\u0647\u0630\u0627 \u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631 \u0644\u0627 \u064A\u0641\u0633\u0631 \u0627\u0644\u0645\u0639\u0637\u064A\u0627\u062A \u0627\u0644\u062D\u0627\u0644\u064A\u0629." : "This choice does not explain the available evidence.", detail: `${selection.options.find((o) => o.optionId === btn.dataset.option)?.feedbackArabic ?? ""} \xB7 ${penaltyDetail(session.stage, "wrongChoice")}` });
          return;
        }
        btn.classList.add("option-card--correct");
        panelEl.querySelectorAll("[data-option]").forEach((b) => b.disabled = true);
        const feedback = panelEl.querySelector('[data-role="decision-feedback"]');
        feedback.innerHTML = `<p class="decision-feedback decision-feedback--correct">${selection.options.find((o) => o.optionId === btn.dataset.option)?.feedbackArabic ?? "\u0627\u062E\u062A\u064A\u0627\u0631 \u0635\u062D\u064A\u062D. \u0627\u0646\u062A\u0642\u0644 \u0625\u0644\u0649 \u062A\u0628\u0631\u064A\u0631 \u0627\u0644\u0642\u0631\u0627\u0631."}</p>`;
        if (session.isAwaitingJustification) {
          renderJustification(panelEl, session, selection.justification);
        }
        showFeedbackToast(panelEl, { correct: true, message: selection.options.find((o) => o.optionId === btn.dataset.option)?.feedbackArabic ?? t("earned") });
      });
    });
  }
  function renderMultipleSelectionObjective(panelEl, session, selection) {
    const displayOptions = selection.shuffle === false ? selection.options : shuffleArray(selection.options);
    panelEl.innerHTML = `
    <h3 class="panel-title">${selection.promptArabic ?? t("chooseMultiple")}</h3>
    ${selection.instructionArabic ? `<p>${selection.instructionArabic}</p>` : ""}
    <div class="multi-option-list">
      ${displayOptions.map((o) => `
        <label class="multi-option" data-option-row="${o.optionId}">
          <input type="checkbox" data-multi-option="${o.optionId}" />
          <span><strong>${o.displayName ?? o.labelArabic ?? o.optionId}</strong></span>
        </label>`).join("")}
    </div>
    <button class="calc-submit" data-action="submit-multiple">${t("submitOptions")}</button>
    <div data-role="decision-feedback" aria-live="polite"></div>
    <div data-role="justification"></div>
    <div data-role="hints"></div>
  `;
    const checks = Array.from(panelEl.querySelectorAll("[data-multi-option]"));
    const submit = panelEl.querySelector('[data-action="submit-multiple"]');
    submit.disabled = true;
    checks.forEach((check) => check.addEventListener("change", () => {
      submit.disabled = !checks.some((item) => item.checked);
    }));
    submit.addEventListener("click", () => {
      const chosen = checks.filter((item) => item.checked).map((item) => item.dataset.multiOption);
      const outcome = session.submitMultipleSelection(chosen);
      if (!outcome) return;
      checks.forEach((item) => {
        item.disabled = true;
      });
      submit.disabled = true;
      const byId = new Map(selection.options.map((option) => [option.optionId, option]));
      const feedbackLines = [
        ...outcome.correctChosen.map((id) => `\u2713 ${byId.get(id)?.displayName ?? byId.get(id)?.labelArabic}: ${byId.get(id)?.feedbackArabic ?? "\u0627\u062E\u062A\u064A\u0627\u0631 \u0645\u0641\u064A\u062F \u0644\u0644\u062A\u062D\u0644\u064A\u0644."}`),
        ...outcome.missedCorrect.map((id) => `\u0644\u0645 \u062A\u062E\u062A\u0631 ${byId.get(id)?.displayName ?? byId.get(id)?.labelArabic}: ${byId.get(id)?.feedbackArabic ?? "\u0647\u0630\u0627 \u0639\u0646\u0635\u0631 \u0645\u0641\u064A\u062F \u0641\u064A \u0627\u0644\u062A\u062D\u0644\u064A\u0644."}`),
        ...outcome.wrongChosen.map((id) => `\u2715 ${byId.get(id)?.displayName ?? byId.get(id)?.labelArabic}: ${byId.get(id)?.feedbackArabic ?? "\u0644\u064A\u0633 \u0639\u0646\u0635\u0631\u064B\u0627 \u0645\u0646\u0627\u0633\u0628\u064B\u0627 \u0644\u0647\u0630\u0627 \u0627\u0644\u062A\u062D\u0644\u064A\u0644."}`)
      ];
      const feedback = panelEl.querySelector('[data-role="decision-feedback"]');
      if (outcome.selectionBonus > 0) feedbackLines.push(`${t("groupBonus")}: +${outcome.selectionBonus} ${t("points")}.`);
      feedback.innerHTML = feedbackLines.map((line) => `<p class="hint-text">${line}</p>`).join("");
      showFeedbackToast(panelEl, {
        correct: outcome.isFullyCorrect,
        message: outcome.isFullyCorrect ? t("earned") : feedbackLines.slice(0, 2).join(" "),
        detail: outcome.isFullyCorrect ? "" : penaltyDetail(session.stage, "wrongChoice"),
        delta: outcome.selectionBonus > 0 ? outcome.selectionBonus : null
      });
      if (session.isAwaitingJustification) renderJustification(panelEl, session, selection.justification);
    });
  }
  function renderJustification(panelEl, session, justification) {
    const host = panelEl.querySelector('[data-role="justification"]');
    if (!host || !justification) return;
    const displayFactors = justification.shuffle === false ? justification.factors : shuffleArray(justification.factors);
    host.innerHTML = `
    <h3 class="panel-title">${getLanguage() === "ar" ? "\u062A\u0628\u0631\u064A\u0631 \u0627\u0644\u0642\u0631\u0627\u0631" : "Justify your decision"}</h3>
    <p>${justification.prompt ?? (getLanguage() === "ar" ? "\u0644\u0645\u0627\u0630\u0627 \u0627\u062E\u062A\u0631\u062A \u0647\u0630\u0627 \u0627\u0644\u062E\u064A\u0627\u0631\u061F \u0627\u062E\u062A\u0631 \u0627\u0644\u0639\u0648\u0627\u0645\u0644 \u0627\u0644\u062A\u064A \u0627\u0639\u062A\u0645\u062F\u062A \u0639\u0644\u064A\u0647\u0627." : "Why did you make this decision? Choose the supporting factors.")}</p>
    <div class="factor-grid">
      ${displayFactors.map(
      (f) => `
        <label class="factor-option">
          <input type="checkbox" data-factor="${f.factorId}" />
          <span>${f.labelArabic}</span>
        </label>`
    ).join("")}
    </div>
    <button class="calc-submit" data-action="confirm-justification" disabled>${getLanguage() === "ar" ? "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062A\u0628\u0631\u064A\u0631" : "Confirm justification"}</button>
    <div data-role="justification-feedback"></div>
  `;
    const checkboxes = Array.from(host.querySelectorAll("[data-factor]"));
    const confirmBtn = host.querySelector('[data-action="confirm-justification"]');
    function updateConfirmState() {
      confirmBtn.disabled = !checkboxes.some((cb) => cb.checked);
    }
    checkboxes.forEach((cb) => cb.addEventListener("change", updateConfirmState));
    confirmBtn.addEventListener("click", () => {
      const chosen = checkboxes.filter((cb) => cb.checked).map((cb) => cb.dataset.factor);
      const outcome = session.submitJustification(chosen);
      if (!outcome) return;
      checkboxes.forEach((cb) => cb.disabled = true);
      confirmBtn.disabled = true;
      renderJustificationFeedback(host, outcome);
      showFeedbackToast(panelEl, { correct: outcome.isFullyCorrect, message: outcome.isFullyCorrect ? t("earned") : t("missed"), delta: Math.round(outcome.netDelta) });
    });
  }
  function renderJustificationFeedback(host, outcome) {
    const box = host.querySelector('[data-role="justification-feedback"]');
    if (!box) return;
    const lines = [];
    outcome.missedCorrect.forEach((id) => {
      const text = outcome.feedback.missedFactor?.[id];
      if (text) lines.push(text);
    });
    outcome.wrongChosen.forEach((id) => {
      const text = outcome.feedback.wrongFactor?.[id];
      if (text) lines.push(text);
    });
    if (lines.length === 0 && outcome.isFullyCorrect) {
      lines.push(t("justificationExcellent"));
    }
    const sign = outcome.netDelta >= 0 ? "+" : "";
    box.innerHTML = lines.map((l) => `<p class="hint-text">${l}</p>`).join("") + `<p class="justification-score readout">${t("justificationScoreImpact")}: ${sign}${Math.round(outcome.netDelta)}</p>`;
  }
  function renderStepAdvance(panelEl, session, detail) {
    const objective = detail.completedObjective;
    const outcome = detail.justificationOutcome;
    const feedbackLines = [];
    outcome?.missedCorrect?.forEach((id) => {
      const line = outcome.feedback?.missedFactor?.[id];
      if (line) feedbackLines.push(line);
    });
    outcome?.wrongChosen?.forEach((id) => {
      const line = outcome.feedback?.wrongFactor?.[id];
      if (line) feedbackLines.push(line);
    });
    if (feedbackLines.length === 0 && outcome?.isFullyCorrect) {
      feedbackLines.push(t("justificationCorrectStep"));
    }
    const delta = outcome?.netDelta ?? 0;
    const sign = delta >= 0 ? "+" : "";
    panelEl.innerHTML = `
    <div class="step-transition">
      <span class="step-counter">${t("completedStep")} ${detail.completedStepIndex + 1} / ${detail.totalSteps}</span>
      <h3>${objective.stepTitleArabic ?? t("diagnosticStep")}</h3>
      ${objective.feedbackArabic ? `<p>${objective.feedbackArabic}</p>` : ""}
      ${feedbackLines.map((line) => `<p class="hint-text">${line}</p>`).join("")}
      ${outcome?.selectionBonus > 0 ? `<p class="justification-score readout">${t("selectionBonusResult")}: +${outcome.selectionBonus} ${t("points")}</p>` : ""}
      <p class="justification-score readout">${t("justificationImpactResult")}: ${sign}${Math.round(delta)} ${t("points")}</p>
      <button class="calc-submit" data-action="continue-step">${t("continueStep")} ${detail.nextStepIndex + 1}</button>
    </div>
  `;
    panelEl.querySelector('[data-action="continue-step"]').addEventListener("click", () => renderObjectivePanel(panelEl, session));
  }
  function renderCalculationObjective(panelEl, session, calc) {
    panelEl.innerHTML = `
    <h3 class="panel-title">${t("enterCalculation")}${calc?.targetParameterKey ? ` (${calc.targetParameterKey})` : ""}</h3>
    <div class="calc-row">
      <input type="number" step="any" class="calc-input" placeholder="${t("valuePlaceholder")}" />
      <button class="calc-submit">${t("confirm")}</button>
    </div>
    <div data-role="calculation-feedback" aria-live="polite"></div>
    <div data-role="hints"></div>
  `;
    panelEl.querySelector(".calc-submit").addEventListener("click", () => {
      const input = panelEl.querySelector(".calc-input");
      const val = parseFloat(input.value);
      if (Number.isNaN(val)) return;
      const correct = session.submitCalculation(val);
      input.style.borderColor = correct ? "var(--verdigris)" : "var(--hazard)";
      const feedback = panelEl.querySelector('[data-role="calculation-feedback"]');
      if (!correct && feedback?.isConnected) {
        const msg = calc?.feedbackArabic ?? "\u0627\u0644\u0646\u062A\u064A\u062C\u0629 \u062E\u0627\u0631\u062C \u0647\u0627\u0645\u0634 \u0627\u0644\u0642\u0628\u0648\u0644. \u0631\u0627\u062C\u0639 \u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0648\u0627\u0644\u0642\u064A\u0645 \u0627\u0644\u0645\u0639\u0648\u064E\u0651\u0636\u0629 \u0648\u0627\u0644\u0639\u0644\u0627\u0642\u0629 \u062B\u0645 \u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.";
        feedback.innerHTML = `<p class="hint-text">${msg}</p>`;
        input.setAttribute("aria-invalid", "true");
      }
      showFeedbackToast(panelEl, { correct, message: calc?.feedbackArabic ?? (correct ? t("earned") : t("missed")), detail: correct ? "" : penaltyDetail(session.stage, "minor") });
    });
  }
  function renderDiagnosisObjective(panelEl, session, diagnosis) {
    const displayHypotheses = diagnosis.shuffle === false ? diagnosis.hypotheses : shuffleArray(diagnosis.hypotheses);
    panelEl.innerHTML = `
    <h3 class="panel-title">${t("diagnose")}</h3>
    <div class="option-grid">
      ${displayHypotheses.map((h) => `<button class="option-card" data-hypothesis="${h.hypothesisId}">${h.labelArabic}</button>`).join("")}
    </div>
    <div data-role="hints"></div>
  `;
    panelEl.querySelectorAll("[data-hypothesis]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const correct = session.submitDiagnosis(btn.dataset.hypothesis);
        if (session.isFinished) return;
        if (!correct) btn.classList.add("option-card--wrong");
        const selected = diagnosis.hypotheses.find((hypothesis) => hypothesis.hypothesisId === btn.dataset.hypothesis);
        showFeedbackToast(panelEl, { correct, message: correct ? selected?.labelArabic ?? t("earned") : t("missed"), detail: correct ? "" : penaltyDetail(session.stage, "wrongChoice") });
      });
    });
  }
  function renderHints(panelEl, session) {
    const host = panelEl.querySelector('[data-role="hints"]');
    if (!host || !session.stage.hints?.length) return;
    host.innerHTML = session.stage.hints.map((h, i) => `<button class="hint-btn" data-hint="${i}">${t("hint")} ${i + 1} (-${h.scorePenalty})</button>`).join("");
    host.querySelectorAll("[data-hint]").forEach((btn) => {
      btn.disabled = session.isHintUsed(Number(btn.dataset.hint));
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.hint);
        if (session.isHintUsed(i)) return;
        session.useHint(i);
        const p = document.createElement("p");
        p.className = "hint-text";
        p.textContent = session.stage.hints[i].textArabic;
        host.insertAdjacentElement("afterend", p);
        btn.disabled = true;
      });
    });
  }
  function renderDebrief(panelEl, result) {
    panelEl.innerHTML = `
    <div class="debrief ${result.success ? "debrief--success" : "debrief--fail"}">
      <h3 class="debrief-title">${result.success ? "\u0646\u062C\u062D\u062A \u0627\u0644\u0645\u0647\u0645\u0629" : "\u0641\u0634\u0644\u062A \u0627\u0644\u0645\u0647\u0645\u0629"}</h3>
      <p>${result.debriefArabic ?? ""}</p>
      <p class="debrief-score">\u0627\u0644\u0646\u062A\u064A\u062C\u0629: ${result.finalScore} / 100 \u2014 ${result.rank}</p>
    </div>
  `;
  }
  function capitalize(value = "") {
    return value ? value[0].toUpperCase() + value.slice(1) : "";
  }
  function penaltyDetail(stage, severity) {
    const key = severity === "minor" ? "minorMistakePenalty" : "wrongChoicePenalty";
    const amount = stage.scoring?.[key] ?? 0;
    return getLanguage() === "ar" ? `\u062E\u0635\u0645 \u0635\u062D\u0629 \u0627\u0644\u0646\u0638\u0627\u0645: ${amount}%` : `System health penalty: ${amount}%`;
  }

  // js/ui/result-screen.js
  var RANK_LABEL_KEYS = {
    masterEngineer: "rankMasterEngineer",
    seniorEngineer: "rankSeniorEngineer",
    hydraulicEngineer: "rankHydraulicEngineer",
    juniorEngineer: "rankJuniorEngineer",
    emergencyTrainingRequired: "rankTrainingRequired"
  };
  function formatTime(seconds) {
    if (seconds === null || seconds === void 0) return "\u2014";
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }
  function renderResultScreen(container, { stage, result, bestScore, hasNext, passScore = 50, stages = [], studentName = "", onRetry, onNext, onStageSelect, onLanguageChange }) {
    const reviewRequired = result.success && !result.passed;
    container.innerHTML = `
    <div class="result-screen">
      <div class="result-plate ${result.success ? "result-plate--success" : "result-plate--fail"}">
        <p class="eyebrow">MISSION REPORT</p>
        <h1 class="result-title">${reviewRequired ? getLanguage() === "ar" ? "\u0645\u0631\u0627\u062C\u0639\u0629 \u0645\u0637\u0644\u0648\u0628\u0629" : "Review required" : result.success ? getLanguage() === "ar" ? "\u0646\u062C\u062D\u062A \u0627\u0644\u0645\u0647\u0645\u0629" : "Mission completed" : getLanguage() === "ar" ? "\u0627\u0646\u062A\u0647\u062A \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629" : "Attempt ended"}</h1>
        <p class="result-stage-title">${getLanguage() === "en" ? stage.learning?.titleEn ?? stage.titleArabic : stage.titleArabic}</p>
        ${reviewRequired ? `<p class="result-debrief result-debrief--review">${getLanguage() === "ar" ? `\u0623\u0643\u0645\u0644\u062A \u062C\u0645\u064A\u0639 \u0627\u0644\u062E\u0637\u0648\u0627\u062A\u060C \u0644\u0643\u0646 \u062F\u0631\u062C\u062A\u0643 (${result.finalScore}) \u0623\u0642\u0644 \u0645\u0646 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649 \u0644\u0644\u0646\u062C\u0627\u062D (${passScore}). \u0631\u0627\u062C\u0639 \u0627\u0644\u0645\u0641\u0627\u0647\u064A\u0645 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0648\u0623\u0639\u062F \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629.` : `You completed all steps but scored ${result.finalScore} / 100, below the passing threshold of ${passScore}. Review the core concepts and try again.`}</p>` : result.debriefArabic ? `<p class="result-debrief">${result.debriefArabic}</p>` : ""}

        <div class="result-stats">
          <div class="result-stat">
            <span class="result-stat-label">${t("score")}</span>
            <span class="result-stat-value readout">${result.finalScore} / 100</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-label">${t("rank")}</span>
            <span class="result-stat-value">${result.rank ? RANK_LABEL_KEYS[result.rank] ? t(RANK_LABEL_KEYS[result.rank]) : result.rank : "\u2014"}</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-label">${t("elapsed")}</span>
            <span class="result-stat-value readout">${formatTime(result.elapsedSeconds ?? (result.timeRemaining === null ? null : (stage.timeLimitSeconds ?? 0) - result.timeRemaining))}</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-label">${getLanguage() === "ar" ? "\u0627\u0644\u0645\u064A\u0632\u0627\u0646\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u0639\u0645\u0644\u0629" : "Budget used"}</span>
            <span class="result-stat-value readout">${result.budgetUsed > 0 ? `\u20AC ${Math.round(result.budgetUsed).toLocaleString(getLanguage() === "ar" ? "ar" : "en")}` : "\u2014"}</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-label">${t("errors")}</span>
            <span class="result-stat-value readout">${result.errorCount}</span>
          </div>
          ${result.correctCount !== void 0 ? `<div class="result-stat"><span class="result-stat-label">${t("correctAnswers")}</span><span class="result-stat-value readout">${result.correctCount}</span></div>` : ""}
          ${result.justificationBonus !== void 0 ? `<div class="result-stat">
            <span class="result-stat-label">${getLanguage() === "ar" ? "\u0623\u062B\u0631 \u0627\u0644\u062A\u0628\u0631\u064A\u0631\u0627\u062A" : "Justification impact"}</span>
            <span class="result-stat-value readout">${result.justificationBonus > 0 ? "+" : ""}${Math.round(result.justificationBonus)} / 100</span>
          </div>` : ""}
          ${result.selectionBonus > 0 ? `<div class="result-stat">
            <span class="result-stat-label">${getLanguage() === "ar" ? "\u0645\u0643\u0627\u0641\u0622\u062A \u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0645\u062A\u0639\u062F\u062F" : "Selection bonuses"}</span>
            <span class="result-stat-value readout">+${Math.round(result.selectionBonus)} / 100</span>
          </div>` : ""}
          <div class="result-stat">
            <span class="result-stat-label">${t("bestScore")}</span>
            <span class="result-stat-value readout">${bestScore ?? "\u2014"}</span>
          </div>
        </div>

        <div class="result-actions">
          <button class="button button--secondary" data-action="retry">${getLanguage() === "ar" ? "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629" : "Retry"}</button>
          ${hasNext && result.passed ? `<button class="button button--primary" data-action="next">${getLanguage() === "ar" ? "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629" : "Next stage"}</button>` : ""}
          <button class="button button--ghost" data-action="stages">${t("stages")}</button>
        </div>
      </div>
    </div>
  `;
    container.querySelector('[data-action="retry"]').addEventListener("click", onRetry);
    container.querySelector('[data-action="stages"]').addEventListener("click", onStageSelect);
    const nextBtn = container.querySelector('[data-action="next"]');
    if (nextBtn && onNext) nextBtn.addEventListener("click", onNext);
    mountPlayerDrawer(container, { studentName, stages, onLanguageChange });
  }

  // js/ui/learning-dialog.js
  var LEVEL_RANK = { unspecified: 0, year1: 1, year2: 2, year3: 3, master: 4 };
  function profileBelowStage(profile, metadata) {
    if (!profile || profile.educationLevel === "unspecified" || !metadata?.academicLevel) return false;
    return (LEVEL_RANK[profile.educationLevel] ?? 0) < (LEVEL_RANK[metadata.academicLevel] ?? 0);
  }
  function renderLearningDialog(container, { stageEntry, metadata, catalog, missingConcepts, profile, onStudy, onStart }) {
    const language2 = getLanguage();
    const previouslyFocused = document.activeElement;
    const dialog = document.createElement("div");
    dialog.className = "learning-backdrop";
    dialog.innerHTML = `<section class="learning-dialog glass-panel" role="dialog" aria-modal="true" aria-labelledby="learning-title">
    <button class="icon-button learning-close" type="button" aria-label="${t("close")}" data-close>\xD7</button>
    <p class="eyebrow">${t("prerequisites")}</p><h2 id="learning-title">${escapeHtml5(getLanguage() === "en" ? metadata.titleEn ?? stageEntry.titleArabic ?? stageEntry.stageId : stageEntry.titleArabic ?? stageEntry.stageId)}</h2>
    <div class="learning-meta"><span>${t("learningLevel")}: ${metadata.academicLevel ? t(`level${metadata.academicLevel[0].toUpperCase()}${metadata.academicLevel.slice(1)}`) : "\u2014"}</span><span>${t("difficulty")}: ${metadata.difficulty ? t(`difficulty${metadata.difficulty}`) : "\u2014"}</span></div>
    <p>${profileBelowStage(profile, metadata) ? language2 === "ar" ? "\u0627\u0644\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0630\u064A \u0627\u062E\u062A\u0631\u062A\u0647 \u0623\u0642\u0644 \u0645\u0646 \u0627\u0644\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0645\u0642\u062A\u0631\u062D \u0644\u0647\u0630\u0647 \u0627\u0644\u0645\u0631\u062D\u0644\u0629. \u064A\u0645\u0643\u0646\u0643 \u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0645\u0641\u0627\u0647\u064A\u0645 \u0623\u0648 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629." : "Your selected study level is below this stage\u2019s suggested level. Review the concepts or continue." : t("studyFirst")}</p>
    <div class="learning-concepts">${(missingConcepts.length ? missingConcepts : metadata.prerequisites ?? []).map((id) => {
      const concept = catalog.concepts?.[id];
      if (!concept) return "";
      return `<article class="lesson-card"><h3>${escapeHtml5(localText(concept.title))}</h3><p>${escapeHtml5(localText(concept.definition))}</p><code>${escapeHtml5(concept.formula ?? "")}</code><small>${escapeHtml5(localText(concept.symbols))}</small></article>`;
    }).join("") || `<p class="empty-state">${t("noPrerequisiteBlock")}</p>`}</div>
    <p class="learning-note">${t("noPrerequisiteBlock")}</p>
    <label class="concept-verification" style="display:flex;align-items:center;gap:8px;margin:8px 0;font-size:0.88rem;cursor:pointer;">
      <input type="checkbox" data-concept-verified checked />
      <span>${language2 === "ar" ? "\u0631\u0627\u062C\u0639\u062A \u0627\u0644\u0645\u0641\u0627\u0647\u064A\u0645 \u0627\u0644\u0647\u064A\u062F\u0631\u0648\u0644\u064A\u0643\u064A\u0629 \u0648\u0627\u0644\u0639\u0644\u0627\u0642\u0627\u062A \u0648\u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629." : "I reviewed the required hydraulic concepts, formulas, and units."}</span>
    </label>
    <div class="learning-actions"><button class="button button--primary" data-study>${t("studyAndContinue")}</button><button class="button button--secondary" data-start>${t("startAnyway")}</button></div>
  </section>`;
    container.appendChild(dialog);
    const closeBtn = dialog.querySelector("[data-close]");
    requestAnimationFrame(() => closeBtn?.focus());
    function closeDialog() {
      dialog.remove();
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
      document.removeEventListener("keydown", onKeyDown);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDialog();
        return;
      }
      if (e.key === "Tab") {
        const focusables = Array.from(dialog.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((el) => el.offsetParent !== null);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    closeBtn.addEventListener("click", closeDialog);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog();
    });
    dialog.querySelector("[data-study]").addEventListener("click", () => {
      onStudy(missingConcepts.length ? missingConcepts : metadata.prerequisites ?? []);
      closeDialog();
    });
    dialog.querySelector("[data-start]").addEventListener("click", () => {
      onStart();
      closeDialog();
    });
  }
  function escapeHtml5(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  // js/core/stage-validator.js
  function hasCalculationObjective(obj) {
    if (!obj) return false;
    if (obj.type === ObjectiveType.CALCULATION || obj.calculation) return true;
    if (obj.subObjectives && Array.isArray(obj.subObjectives)) {
      return obj.subObjectives.some(hasCalculationObjective);
    }
    return false;
  }
  function hasFormulaScoredObjective(obj) {
    if (!obj) return false;
    if (obj.selection?.scoreAsFormula === true) return true;
    if (obj.calculation?.scoreAsFormula === true) return true;
    if (obj.subObjectives && Array.isArray(obj.subObjectives)) {
      return obj.subObjectives.some(hasFormulaScoredObjective);
    }
    return false;
  }
  function validateStage(stage, isRoot = true) {
    const problems = [];
    if (isRoot) {
      if (!stage.stageId || typeof stage.stageId !== "string") {
        problems.push("Missing or invalid stageId.");
      }
      if (stage.scoring) {
        const s = stage.scoring;
        const calcWeight = s.calculationAccuracyWeight ?? 0;
        const formulaWeight = s.correctFormulaWeight ?? 0;
        const speedWeight = s.solveSpeedWeight ?? 0;
        const errorWeight = s.errorCountWeight ?? 0;
        const decisionWeight = s.engineeringDecisionsWeight ?? 0;
        const sum = calcWeight + formulaWeight + speedWeight + errorWeight + decisionWeight;
        if (sum !== 100) {
          problems.push(`Scoring weights must sum to 100, got ${sum}.`);
        }
        if (calcWeight > 0 && !hasCalculationObjective(stage.objective)) {
          problems.push(`calculationAccuracyWeight is ${calcWeight}%, but stage has no calculation objective.`);
        }
        if (formulaWeight > 0 && !hasFormulaScoredObjective(stage.objective)) {
          problems.push(`correctFormulaWeight is ${formulaWeight}%, but stage has no objective with scoreAsFormula: true.`);
        }
      }
    }
    if (!stage.objective) {
      problems.push("No objective assigned.");
      return problems;
    }
    const { objective } = stage;
    switch (objective.type) {
      case ObjectiveType.SELECTION: {
        const sel = objective.selection;
        if (!sel || !sel.options || sel.options.length === 0) {
          problems.push("Selection objective has no options.");
          break;
        }
        if (sel.mode === "multiple") {
          const ids = new Set(sel.options.map((o) => o.optionId));
          if (!sel.justification) {
            problems.push("Multi-selection objective has no follow-up justification, so the player cannot complete this step.");
          }
          if (!Array.isArray(sel.correctOptionIds) || sel.correctOptionIds.length === 0) {
            problems.push("Multi-selection objective has no correctOptionIds.");
          } else {
            sel.correctOptionIds.forEach((id) => {
              if (!ids.has(id)) problems.push(`correctOptionIds contains '${id}', which matches no option.`);
            });
          }
        } else {
          const anyMeets = sel.options.some((o) => o.meetsRequirements);
          const correctIdExists = sel.options.some((o) => o.optionId === sel.correctOptionId);
          if (!sel.correctOptionId) {
            problems.push("Single-selection objective is missing correctOptionId.");
          }
          if (!anyMeets) {
            problems.push(
              "No option has meetsRequirements = true \u2014 this stage currently has no valid answer."
            );
          }
          if (sel.correctOptionId && !correctIdExists) {
            problems.push(`correctOptionId '${sel.correctOptionId}' matches no option.`);
          } else if (sel.correctOptionId && !sel.options.find((o) => o.optionId === sel.correctOptionId)?.meetsRequirements) {
            problems.push(`correctOptionId '${sel.correctOptionId}' does not point to an option marked meetsRequirements = true.`);
          }
        }
        if (sel.scoreAsFormula === true && sel.mode === "multiple" && (!Array.isArray(sel.correctOptionIds) || sel.correctOptionIds.length === 0)) {
          problems.push("Formula-scored multi-selection objective has no correctOptionIds.");
        }
        if (sel.justification) {
          const factors = sel.justification.factors;
          if (!Array.isArray(factors) || factors.length === 0) {
            problems.push("Selection objective has a justification block with no factors.");
          } else if (!factors.some((f) => f.correct)) {
            problems.push(
              "Justification factors have no factor marked correct \u2014 the step could never be fully justified."
            );
          }
        }
        break;
      }
      case ObjectiveType.CALCULATION:
        if (!objective.calculation) {
          problems.push("Calculation objective is missing its target.");
        }
        break;
      case ObjectiveType.DIAGNOSIS: {
        const diag = objective.diagnosis;
        const hasCorrect = diag?.hypotheses?.some((h) => h.isCorrect);
        if (!hasCorrect) {
          problems.push("Diagnosis objective has no hypothesis marked isCorrect.");
        }
        break;
      }
      case ObjectiveType.MULTI_STEP:
        if (!objective.subObjectives || objective.subObjectives.length === 0) {
          problems.push("MultiStep objective has no subObjectives.");
        } else {
          objective.subObjectives.forEach((sub, i) => {
            validateStage({ ...stage, objective: sub }, false).forEach(
              (p) => problems.push(`subObjectives[${i}]: ${p}`)
            );
          });
        }
        break;
      default:
        problems.push(`Unknown objective type '${objective.type}'.`);
    }
    if (stage.hints && stage.hints.length !== 3) {
      problems.push(`Expected 3 hints per the design doc, found ${stage.hints.length}.`);
    }
    for (const pipe of stage.network?.pipes ?? []) {
      if (pipe.roughnessMm === void 0) {
        problems.push(
          `Pipe '${pipe.pipeId}' has no roughnessMm \u2014 hf cannot be honestly calculated without it.`
        );
      }
    }
    return problems;
  }
  if (typeof process !== "undefined" && process.argv?.[1]?.replace(/\\/g, "/").endsWith("stage-validator.js")) {
    (async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      let rawArgs = process.argv.slice(2);
      let files = [];
      if (rawArgs.length === 0) {
        rawArgs = ["data/stages/stage-*.json"];
      }
      for (const arg of rawArgs) {
        if (fs.existsSync(arg) && fs.statSync(arg).isDirectory()) {
          const dirFiles = fs.readdirSync(arg).filter((f) => f.startsWith("stage-") && f.endsWith(".json")).map((f) => path.join(arg, f));
          files.push(...dirFiles);
        } else if (arg.includes("*") || arg.includes("?")) {
          const dir = path.dirname(arg) || ".";
          const filePattern = path.basename(arg);
          const regex = new RegExp("^" + filePattern.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
          if (fs.existsSync(dir)) {
            const matched = fs.readdirSync(dir).filter((f) => regex.test(f)).map((f) => path.join(dir, f));
            files.push(...matched);
          }
        } else {
          files.push(arg);
        }
      }
      files = [...new Set(files)].sort();
      let hadProblems = false;
      const stageIdsSeen = /* @__PURE__ */ new Map();
      for (const file of files) {
        try {
          const stage = JSON.parse(fs.readFileSync(file, "utf8"));
          const problems = validateStage(stage);
          if (stage.stageId) {
            if (stageIdsSeen.has(stage.stageId)) {
              problems.push(`Duplicate stageId '${stage.stageId}' also found in '${stageIdsSeen.get(stage.stageId)}'.`);
            } else {
              stageIdsSeen.set(stage.stageId, file);
            }
          }
          if (problems.length) {
            hadProblems = true;
            console.warn(`
${file}:`);
            problems.forEach((p) => console.warn(`  - ${p}`));
          }
        } catch (err) {
          hadProblems = true;
          console.warn(`
${file}:`);
          console.warn(`  - Failed to read or parse JSON: ${err.message}`);
        }
      }
      if (!hadProblems) {
        console.log(`All ${files.length} stages valid.`);
      }
      process.exit(hadProblems ? 1 : 0);
    })();
  }

  // js/stage-loader.js
  async function loadStage(url) {
    let stage = null;
    if (typeof window !== "undefined" && window.__EMERGENCY_DATA__?.stages) {
      const filename = url.split("/").pop().split("?")[0];
      stage = window.__EMERGENCY_DATA__.stages[filename] || window.__EMERGENCY_DATA__.stages[url] || Object.values(window.__EMERGENCY_DATA__.stages).find((s) => s.stageId === url || s.stageId === filename);
    }
    if (!stage) {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`\u062A\u0639\u0630\u0651\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0631\u062D\u0644\u0629: ${url} (HTTP ${res.status})`);
      }
      stage = await res.json();
    }
    const problems = validateStage(stage);
    if (problems.length > 0) {
      console.warn(`[stage-loader] \u0645\u0634\u0627\u0643\u0644 \u0641\u064A \u0627\u0644\u0645\u0631\u062D\u0644\u0629 "${stage.stageId ?? url}":`);
      problems.forEach((p) => console.warn("  - " + p));
    }
    return stage;
  }

  // js/stage-manifest.js
  var import_meta2 = {};
  var MANIFEST_URL = typeof import_meta2 !== "undefined" && import_meta2.url ? new URL("../data/stages/index.json", import_meta2.url) : null;
  var STAGES_BASE_URL = typeof import_meta2 !== "undefined" && import_meta2.url ? new URL("../data/stages/", import_meta2.url) : null;
  var cached = null;
  async function loadManifest() {
    if (cached) return cached;
    let data;
    if (typeof window !== "undefined" && window.__EMERGENCY_DATA__?.manifest) {
      data = window.__EMERGENCY_DATA__.manifest;
    } else if (MANIFEST_URL) {
      const res = await fetch(MANIFEST_URL);
      if (!res.ok) throw new Error(`\u062A\u0639\u0630\u0651\u0631 \u062A\u062D\u0645\u064A\u0644 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0631\u0627\u062D\u0644 (HTTP ${res.status})`);
      data = await res.json();
    } else {
      throw new Error("\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0631\u0627\u062D\u0644");
    }
    cached = (data.stages ?? []).map((entry) => ({
      ...entry,
      url: STAGES_BASE_URL ? new URL(entry.url, STAGES_BASE_URL).href : entry.url
    }));
    return cached;
  }
  async function nextStageId(stageId) {
    const stages = await loadManifest();
    const i = stages.findIndex((s) => s.stageId === stageId);
    if (i === -1 || i === stages.length - 1) return null;
    return stages[i + 1].stageId;
  }
  async function findStageEntry(stageId) {
    const stages = await loadManifest();
    return stages.find((s) => s.stageId === stageId) ?? null;
  }

  // js/game-config.js
  var PASS_SCORE = 50;

  // js/pwa-install.js
  var installPrompt = null;
  var DISMISSED_KEY = "emergencyEngineer:pwaInstallDismissed";
  function isStandalone() {
    return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }
  function isAppleMobile() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  }
  function wasDismissed() {
    try {
      return localStorage.getItem(DISMISSED_KEY) === "true";
    } catch {
      return false;
    }
  }
  function removeInstallCard() {
    document.querySelector("[data-pwa-install]")?.remove();
  }
  function mountInstallCard() {
    const menu = document.querySelector(".menu-plate");
    if (!menu || isStandalone() || wasDismissed() || !installPrompt && !isAppleMobile()) return;
    if (menu.querySelector("[data-pwa-install]")) return;
    const isArabic = document.documentElement.lang === "ar";
    const card = document.createElement("aside");
    card.className = "pwa-install";
    card.dataset.pwaInstall = "";
    card.innerHTML = `
    <div class="pwa-install__copy">
      <strong>${isArabic ? "\u062B\u0628\u0651\u062A \u0627\u0644\u0644\u0639\u0628\u0629 \u0639\u0644\u0649 \u062C\u0647\u0627\u0632\u0643" : "Install the game on your device"}</strong>
      <p data-pwa-install-help>${isArabic ? isAppleMobile() ? "\u0623\u0636\u0641\u0647\u0627 \u0625\u0644\u0649 \u0627\u0644\u0634\u0627\u0634\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629 \u0644\u0641\u062A\u062D\u0647\u0627 \u0643\u062A\u0637\u0628\u064A\u0642." : "\u0627\u0641\u062A\u062D\u0647\u0627 \u0643\u062A\u0637\u0628\u064A\u0642 \u0645\u0633\u062A\u0642\u0644 \u0645\u0646 \u0634\u0627\u0634\u062A\u0643 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629." : isAppleMobile() ? "Add it to your Home Screen to open it like an app." : "Open it as a standalone app from your home screen."}</p>
    </div>
    <button class="pwa-install__action" type="button" data-pwa-install-action>${isArabic ? isAppleMobile() ? "\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u0625\u0636\u0627\u0641\u0629" : "\u062A\u062B\u0628\u064A\u062A \u0627\u0644\u0644\u0639\u0628\u0629" : isAppleMobile() ? "How to add" : "Install game"}</button>
    <button class="pwa-install__dismiss" type="button" aria-label="${isArabic ? "\u0625\u062E\u0641\u0627\u0621" : "Dismiss"}" data-pwa-install-dismiss>\xD7</button>`;
    const actions = menu.querySelector(".menu-actions");
    (actions?.parentElement ?? menu).insertBefore(card, actions?.nextSibling ?? null);
    card.querySelector("[data-pwa-install-action]").addEventListener("click", async () => {
      if (isAppleMobile()) {
        const help = card.querySelector("[data-pwa-install-help]");
        help.textContent = isArabic ? "\u0641\u064A Safari: \u0627\u0636\u063A\u0637 \xAB\u0645\u0634\u0627\u0631\u0643\u0629\xBB \u062B\u0645 \xAB\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u0634\u0627\u0634\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629\xBB. " : "In Safari, tap Share, then \u201CAdd to Home Screen\u201D.";
        return;
      }
      if (!installPrompt) return;
      const promptEvent = installPrompt;
      installPrompt = null;
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === "accepted") removeInstallCard();
    });
    card.querySelector("[data-pwa-install-dismiss]").addEventListener("click", () => {
      try {
        localStorage.setItem(DISMISSED_KEY, "true");
      } catch {
      }
      removeInstallCard();
    });
  }
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    mountInstallCard();
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    removeInstallCard();
  });
  window.addEventListener("pageshow", mountInstallCard);
  window.addEventListener("pwa-install-availability", mountInstallCard);
  new MutationObserver(mountInstallCard).observe(document.getElementById("app"), { childList: true, subtree: true });
  if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js", { scope: "./", updateViaCache: "none" }).then((registration) => registration.update()).catch((error) => console.warn("[pwa] Service worker unavailable:", error));
    }, { once: true });
  }

  // js/main.js
  var app = document.getElementById("app");
  var manifest = [];
  var learningCatalog = null;
  var activeMission = false;
  async function boot() {
    try {
      manifest = await loadManifest();
      if (manifest.length > 0) ensureFirstStageUnlocked(manifest[0].stageId);
    } catch (error) {
      console.error(error);
    }
    try {
      learningCatalog = await loadLearningCatalog();
    } catch (error) {
      console.warn("[learning] Optional learning metadata unavailable:", error);
    }
    if (!getStudentName()) showNameEntry();
    else showMenu();
  }
  function showNameEntry() {
    renderNameEntryScreen(app, {
      onSubmit: (name, educationLevel) => {
        setStudentName(name);
        updateProfile({ educationLevel });
        showWelcome();
      },
      onLanguageChange: showNameEntry
    });
  }
  function showWelcome() {
    renderWelcomeScreen(app, {
      studentName: getStudentName(),
      onStart: () => {
        updateProfile({ introSeen: true });
        showStageSelect();
      },
      // P20: pass explicit boolean — was accidentally passing the click Event object.
      onAbout: () => showAbout(true)
    });
  }
  function showAbout(fromWelcome = false) {
    renderAboutScreen(app, {
      studentName: getStudentName(),
      onBack: fromWelcome ? showWelcome : showMenu,
      onStart: () => {
        updateProfile({ introSeen: true });
        showStageSelect();
      }
    });
  }
  function showMenu() {
    activeMission = false;
    renderMenuScreen(app, {
      studentName: getStudentName(),
      stages: manifest,
      onPlay: showStageSelect,
      onAbout: () => showAbout(false),
      onLanguageChange: showMenu
    });
  }
  async function showStageSelect() {
    activeMission = false;
    app.innerHTML = `<div class="loading"><span class="loading-mark"></span>${document.documentElement.lang === "ar" ? "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u0645\u064A\u0644\u2026" : "Loading\u2026"}</div>`;
    try {
      if (!manifest.length) manifest = await loadManifest();
      if (!learningCatalog) {
        try {
          learningCatalog = await loadLearningCatalog();
        } catch (error) {
          console.warn("[learning] Showing stages without optional metadata:", error);
        }
      }
      renderStageSelectScreen(app, manifest, {
        isUnlocked: isStageUnlocked,
        getBestScore,
        isCompleted: isStageCompleted,
        learning: learningCatalog?.stages ?? {},
        studentName: getStudentName(),
        onSelectStage: beginStage,
        onBack: showMenu,
        onLanguageChange: showStageSelect
      });
    } catch (error) {
      console.error(error);
      app.innerHTML = `<div class="loading">${document.documentElement.lang === "ar" ? "\u062A\u0639\u0630\u0651\u0631 \u062A\u062D\u0645\u064A\u0644 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0631\u0627\u062D\u0644." : "Could not load the stage list."}<button class="button button--secondary" onclick="location.reload()">${document.documentElement.lang === "ar" ? "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629" : "Retry"}</button></div>`;
    }
  }
  async function beginStage(entry) {
    if (!isStageUnlocked(entry.stageId)) return;
    try {
      const learning = await getStageLearning(entry.stageId);
      const missingConcepts = getMissingPrerequisites(learning);
      const tooAdvanced = profileBelowStage(getProfile(), learning);
      if ((missingConcepts.length || tooAdvanced) && learningCatalog) {
        renderLearningDialog(app, {
          stageEntry: entry,
          metadata: learning,
          catalog: learningCatalog,
          missingConcepts,
          profile: getProfile(),
          onStudy: (ids) => {
            studyConcepts(ids);
            playStage(entry, learning);
          },
          onStart: () => playStage(entry, learning)
        });
      } else {
        playStage(entry, learning);
      }
    } catch (error) {
      console.warn("[learning] Could not load prerequisites:", error);
      playStage(entry, null);
    }
  }
  async function playStage(entry, learning = null) {
    activeMission = false;
    playTransitionSound();
    app.innerHTML = `<div class="loading"><span class="loading-mark"></span>${document.documentElement.lang === "ar" ? "\u062C\u0627\u0631\u064D \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0647\u0645\u0629\u2026" : "Loading mission\u2026"}</div>`;
    try {
      const stage = await loadStage(entry.url);
      stage.stageIndexInLevel = entry.stageIndexInLevel ?? stage.stageIndexInLevel;
      stage.learning = learning ?? learningCatalog?.stages?.[stage.stageId] ?? null;
      activeMission = true;
      renderStageScreen(app, stage, {
        studentName: getStudentName(),
        stages: manifest,
        onExit: showStageSelect,
        onStageEnded: (result) => showResult(stage, entry, result)
      });
    } catch (error) {
      activeMission = false;
      console.error(error);
      app.innerHTML = `<div class="loading">${document.documentElement.lang === "ar" ? "\u062A\u0639\u0630\u0651\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0631\u062D\u0644\u0629." : "Could not load this stage."}<button class="button button--secondary" onclick="location.reload()">${document.documentElement.lang === "ar" ? "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629" : "Retry"}</button></div>`;
    }
  }
  async function showResult(stage, entry, result) {
    activeMission = false;
    const passedScore = result.success && result.finalScore >= PASS_SCORE;
    const { bestScore } = recordStageResult(stage.stageId, {
      success: passedScore,
      score: result.finalScore
    });
    const enrichedResult = { ...result, passed: passedScore };
    recordStageEvent({
      type: "stageAttempt",
      stageId: stage.stageId,
      stageIndex: entry.stageIndexInLevel,
      success: result.success,
      score: result.finalScore,
      passed: passedScore,
      errorCount: result.errorCount,
      correctCount: result.correctCount ?? 0,
      elapsedSeconds: result.elapsedSeconds ?? 0,
      rank: result.rank
    });
    let nextEntry = null;
    if (passedScore) {
      if (stage.learning?.concepts?.length) studyConcepts(stage.learning.concepts);
      const nextId = await nextStageId(stage.stageId);
      if (nextId) {
        const wasUnlocked = isStageUnlocked(nextId);
        unlockStage(nextId);
        nextEntry = await findStageEntry(nextId);
        if (!wasUnlocked) {
          recordStageEvent({ type: "stageUnlocked", stageId: nextId, stageIndex: nextEntry?.stageIndexInLevel });
          playUnlockSound();
        }
      }
    }
    const resultOptions = {
      stage,
      result: enrichedResult,
      bestScore,
      hasNext: !!nextEntry,
      passScore: PASS_SCORE,
      stages: manifest,
      studentName: getStudentName(),
      onRetry: () => playStage(entry, stage.learning),
      onNext: nextEntry ? () => beginStage(nextEntry) : null,
      onStageSelect: showStageSelect,
      onLanguageChange: () => renderResultScreen(app, resultOptions)
    };
    renderResultScreen(app, resultOptions);
  }
  setLanguage(getSettings().language);
  boot();
})();
