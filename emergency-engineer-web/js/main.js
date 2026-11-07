// Emergency Engineer — game app entry point and screen router.
import { renderMenuScreen } from './ui/menu-screen.js';
import { renderNameEntryScreen } from './ui/name-entry-screen.js';
import { renderWelcomeScreen, renderAboutScreen } from './ui/welcome-screen.js';
import { renderStageSelectScreen } from './ui/stage-select-screen.js';
import { renderStageScreen } from './ui/stage-screen.js';
import { renderResultScreen } from './ui/result-screen.js';
import { renderLearningDialog, profileBelowStage } from './ui/learning-dialog.js';
import { loadStage } from './stage-loader.js';
import { loadManifest, nextStageId, findStageEntry } from './stage-manifest.js';
import * as progress from './progress-store.js';
import * as playerData from './player-data-store.js';
import { setLanguage } from './i18n.js';
import { loadLearningCatalog, getStageLearning, getMissingPrerequisites, studyConcepts } from './learning-service.js';
import { playTransitionSound, playUnlockSound } from './audio-manager.js';
import { PASS_SCORE } from './game-config.js';
import './pwa-install.js';

const app = document.getElementById('app');
let manifest = [];
let learningCatalog = null;
let activeMission = false;

async function boot() {
  try {
    manifest = await loadManifest();
    if (manifest.length > 0) progress.ensureFirstStageUnlocked(manifest[0].stageId);
  } catch (error) {
    console.error(error);
  }
  try { learningCatalog = await loadLearningCatalog(); }
  catch (error) { console.warn('[learning] Optional learning metadata unavailable:', error); }

  if (!progress.getStudentName()) showNameEntry();
  else showMenu();
}

function showNameEntry() {
  renderNameEntryScreen(app, {
    onSubmit: (name, educationLevel) => {
      progress.setStudentName(name);
      playerData.updateProfile({ educationLevel });
      showWelcome();
    },
    onLanguageChange: showNameEntry,
  });
}

function showWelcome() {
  renderWelcomeScreen(app, {
    studentName: progress.getStudentName(),
    onStart: () => { playerData.updateProfile({ introSeen: true }); showStageSelect(); },
    // P20: pass explicit boolean — was accidentally passing the click Event object.
    onAbout: () => showAbout(true),
  });
}

function showAbout(fromWelcome = false) {
  renderAboutScreen(app, {
    studentName: progress.getStudentName(),
    onBack: fromWelcome ? showWelcome : showMenu,
    onStart: () => { playerData.updateProfile({ introSeen: true }); showStageSelect(); },
  });
}

function showMenu() {
  activeMission = false;
  renderMenuScreen(app, {
    studentName: progress.getStudentName(),
    stages: manifest,
    onPlay: showStageSelect,
    onAbout: () => showAbout(false),
    onLanguageChange: showMenu,
  });
}

async function showStageSelect() {
  activeMission = false;
  app.innerHTML = `<div class="loading"><span class="loading-mark"></span>${document.documentElement.lang === 'ar' ? 'جارٍ التحميل…' : 'Loading…'}</div>`;
  try {
    if (!manifest.length) manifest = await loadManifest();
    if (!learningCatalog) {
      try { learningCatalog = await loadLearningCatalog(); }
      catch (error) { console.warn('[learning] Showing stages without optional metadata:', error); }
    }
    renderStageSelectScreen(app, manifest, {
      isUnlocked: progress.isStageUnlocked,
      getBestScore: progress.getBestScore,
      isCompleted: progress.isStageCompleted,
      learning: learningCatalog?.stages ?? {},
      studentName: progress.getStudentName(),
      onSelectStage: beginStage,
      onBack: showMenu,
      onLanguageChange: showStageSelect,
    });
  } catch (error) {
    console.error(error);
    app.innerHTML = `<div class="loading">${document.documentElement.lang === 'ar' ? 'تعذّر تحميل قائمة المراحل.' : 'Could not load the stage list.'}<button class="button button--secondary" onclick="location.reload()">${document.documentElement.lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button></div>`;
  }
}

async function beginStage(entry) {
  if (!progress.isStageUnlocked(entry.stageId)) return;
  try {
    const learning = await getStageLearning(entry.stageId);
    const missingConcepts = getMissingPrerequisites(learning);
    const tooAdvanced = profileBelowStage(playerData.getProfile(), learning);
    if ((missingConcepts.length || tooAdvanced) && learningCatalog) {
      renderLearningDialog(app, {
        stageEntry: entry,
        metadata: learning,
        catalog: learningCatalog,
        missingConcepts,
        profile: playerData.getProfile(),
        onStudy: (ids) => { studyConcepts(ids); playStage(entry, learning); },
        onStart: () => playStage(entry, learning),
      });
    } else {
      playStage(entry, learning);
    }
  } catch (error) {
    console.warn('[learning] Could not load prerequisites:', error);
    playStage(entry, null);
  }
}

async function playStage(entry, learning = null) {
  activeMission = false;
  playTransitionSound();
  app.innerHTML = `<div class="loading"><span class="loading-mark"></span>${document.documentElement.lang === 'ar' ? 'جارٍ تحميل المهمة…' : 'Loading mission…'}</div>`;
  try {
    const stage = await loadStage(entry.url);
    stage.stageIndexInLevel = entry.stageIndexInLevel ?? stage.stageIndexInLevel;
    stage.learning = learning ?? learningCatalog?.stages?.[stage.stageId] ?? null;
    activeMission = true;
    renderStageScreen(app, stage, {
      studentName: progress.getStudentName(),
      stages: manifest,
      onExit: showStageSelect,
      onStageEnded: (result) => showResult(stage, entry, result),
    });
  } catch (error) {
    activeMission = false;
    console.error(error);
    app.innerHTML = `<div class="loading">${document.documentElement.lang === 'ar' ? 'تعذّر تحميل المرحلة.' : 'Could not load this stage.'}<button class="button button--secondary" onclick="location.reload()">${document.documentElement.lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button></div>`;
  }
}

async function showResult(stage, entry, result) {
  activeMission = false;
  // P1-#5: A stage is only truly "completed" when success=true AND the score
  // is at or above PASS_SCORE. Completing all steps with a very low score
  // should not unlock the next stage.
  const passedScore = result.success && result.finalScore >= PASS_SCORE;
  const { bestScore } = progress.recordStageResult(stage.stageId, {
    success: passedScore,
    score: result.finalScore,
  });
  // Attach pass status so result-screen can display the 'review required' message.
  const enrichedResult = { ...result, passed: passedScore };

  playerData.recordStageEvent({
    type: 'stageAttempt',
    stageId: stage.stageId,
    stageIndex: entry.stageIndexInLevel,
    success: result.success,
    score: result.finalScore,
    passed: passedScore,
    errorCount: result.errorCount,
    correctCount: result.correctCount ?? 0,
    elapsedSeconds: result.elapsedSeconds ?? 0,
    rank: result.rank,
  });

  let nextEntry = null;
  if (passedScore) {
    if (stage.learning?.concepts?.length) studyConcepts(stage.learning.concepts);
    const nextId = await nextStageId(stage.stageId);
    if (nextId) {
      const wasUnlocked = progress.isStageUnlocked(nextId);
      progress.unlockStage(nextId);
      nextEntry = await findStageEntry(nextId);
      if (!wasUnlocked) {
        playerData.recordStageEvent({ type: 'stageUnlocked', stageId: nextId, stageIndex: nextEntry?.stageIndexInLevel });
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
    studentName: progress.getStudentName(),
    onRetry: () => playStage(entry, stage.learning),
    onNext: nextEntry ? () => beginStage(nextEntry) : null,
    onStageSelect: showStageSelect,
    onLanguageChange: () => renderResultScreen(app, resultOptions),
  };
  renderResultScreen(app, resultOptions);
}

setLanguage(playerData.getSettings().language);
boot();
