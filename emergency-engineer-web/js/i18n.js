import { getSettings, updateSettings } from './player-data-store.js';

const STRINGS = {
  ar: {
    appName: 'مهندس الطوارئ', start: 'ابدأ اللعب', play: 'اختيار المرحلة', about: 'نبذة عن اللعبة',
    continue: 'متابعة', back: 'رجوع', save: 'حفظ', cancel: 'إلغاء', close: 'إغلاق',
    welcome: 'مرحبًا بك', welcomeText: 'تدرّب على قراءة المؤشرات، وفهم الأدلة، واتخاذ قرار هندسي مسؤول.',
    playerName: 'اسم الطالب', educationLevel: 'المستوى الدراسي', chooseLevel: 'اختر مستواك الدراسي (اختياري)',
    levelUnspecified: 'أفضل عدم التحديد الآن', levelYear1: 'السنة الأولى', levelYear2: 'السنة الثانية',
    levelYear3: 'السنة الثالثة', levelMaster: 'ماستر / متقدم',
    aboutTitle: 'كيف تعمل اللعبة؟', aboutBody: 'كل مرحلة مهمة هندسية. اقرأ الحالة، حلل القياسات، اختر القرار، ثم برره. الأخطاء تخفض صحة النظام وتظهر معها ملاحظات تعليمية؛ أما النقاط فتُحسب وفق نظام المرحلة الحالي.',
    aboutProgress: 'يفتح النجاح المرحلة التالية. يمكنك إعادة المحاولة ومراجعة أفضل نتيجة.',
    aboutTools: 'الأدوات والمعطيات تساعد على التحليل؛ الخريطة تمثيل بصري للشبكة وليست محاكاة تدفق فعلية.',
    skipIntro: 'تخطي الشرح', overview: 'مركز القيادة', stages: 'المراحل', notebook: 'دفتر المهندس',
    eventLog: 'سجل الأحداث', tools: 'الأدوات والمعرفة', achievements: 'الإنجازات', settings: 'الإعدادات',
    profile: 'ملف اللاعب', completed: 'المراحل المكتملة', bestScore: 'أفضل نتيجة', averageScore: 'متوسط النتائج', correctAnswers: 'إجابات صحيحة',
    errors: 'الأخطاء', timePlayed: 'وقت اللعب المسجل', rank: 'الرتبة التعليمية', addNote: 'أضف ملاحظة',
    noteTitle: 'عنوان الملاحظة', noteBody: 'اكتب ما تعلمته أو ما تريد مراجعته', edit: 'تعديل', delete: 'حذف',
    noNotes: 'لا توجد ملاحظات بعد.', noEvents: 'سيظهر هنا سجل المحاولات المهمة.', noTools: 'أكمل المراحل لاكتشاف المفاهيم.',
    language: 'اللغة', arabic: 'العربية', english: 'English', sound: 'المؤثرات الصوتية', music: 'الموسيقى',
    on: 'تشغيل', off: 'إيقاف', menu: 'القائمة', currentStage: 'المرحلة الحالية', progress: 'التقدم', timeRemaining: 'الوقت المتبقي',
    unlocked: 'مفتوحة', locked: 'مقفلة', done: 'مكتملة', stage: 'المرحلة',
    prerequisites: 'معرفة تساعدك في هذه المرحلة', studyFirst: 'تعرّف على المفهوم ثم تابع، أو ابدأ المرحلة الآن.',
    studyAndContinue: 'ادرس وتابع', startAnyway: 'ابدأ دون الدراسة الآن', studied: 'تمت مراجعة هذا المفهوم',
    learningLevel: 'مستوى المرحلة', difficulty: 'الصعوبة', concepts: 'المفاهيم', outcome: 'ما ستتعلمه',
    success: 'إجابة صحيحة', wrong: 'إجابة غير صحيحة', earned: 'أحسنت، واصل التحليل.',
    missed: 'راجع الدليل والشرح ثم حاول مجددًا.', closeToast: 'إغلاق التنبيه',
    zoomIn: 'تكبير الخريطة', zoomOut: 'تصغير الخريطة', resetMap: 'إعادة ضبط الخريطة',
    stageCompleted: 'تم إكمال المرحلة', stageFailed: 'انتهت المحاولة', stageUnlocked: 'تم فتح مرحلة جديدة',
    firstMission: 'أول مهمة', fiveMissions: 'محلل هيدروليكي', noMistakes: 'مهندس دقيق', finalMission: 'مهندس الطوارئ',
    noPrerequisiteBlock: 'المتطلبات للتعلم وليست قفلًا؛ يمكنك بدء المرحلة في أي وقت.',
    completedCount: 'عدد المراحل المكتملة', elapsed: 'المدة', score: 'النتيجة', health: 'صحة النظام', budget: 'الميزانية',
    rankMasterEngineer: 'مهندس أعلى', rankSeniorEngineer: 'مهندس أول', rankHydraulicEngineer: 'مهندس هيدروليك', rankJuniorEngineer: 'مهندس مبتدئ', rankTrainingRequired: 'يحتاج تدريبًا إضافيًا',
    arabicStageNotice: 'بعض نصوص هذه المرحلة متاحة بالعربية حاليًا.',
    difficultyBeginner: 'مبتدئ', difficultyIntermediate: 'متوسط', difficultyAdvanced: 'متقدم', difficultyExpert: 'خبير',
    noObjective: 'لا يوجد هدف لهذه المرحلة.', unsupportedObjective: 'نوع الهدف غير مدعوم بعد في الواجهة.',
    chooseOption: 'اختر الخيار المناسب', chooseMultiple: 'حدد كل الاختيارات المناسبة', submitOptions: 'تقييم الاختيارات',
    enterCalculation: 'أدخل نتيجة الحساب', valuePlaceholder: 'القيمة', confirm: 'تأكيد', diagnose: 'شخّص المشكلة',
    hint: 'تلميح', continueStep: 'انتقل إلى الجزء', completedStep: 'اكتمل الجزء', justificationExcellent: 'تبرير ممتاز — حددت كل العوامل الصحيحة بدون أي عامل غير مناسب.',
    selectedPipe: 'أنبوب محدَّد', selectedNode: 'عقدة محدَّدة', part: 'الجزء', diagnosticStep: 'خطوة التشخيص',
    investigationSummary: 'ملخص ما جمعته في التحقيق', choicesMatchEvidence: 'الاختيارات متوافقة مع المعطيات',
    choicesNeedReview: 'توجد اختيارات ناقصة أو تحتاج إلى مراجعة', summaryNote: 'استخدم هذا السجل مع قراءات الشبكة قبل اعتماد التوصية النهائية.',
    groupBonus: 'مكافأة المجموعة الصحيحة', justificationScoreImpact: 'تأثير التبرير على النتيجة',
    justificationCorrectStep: 'تبرير صحيح: حددت العوامل المناسبة لهذه الخطوة.', selectionBonusResult: 'مكافأة الاختيارات',
    justificationImpactResult: 'أثر التبرير', points: 'نقطة', reviewRequired: 'مراجعة مطلوبة',
    extraTime: 'وقت إضافي (مضاعفة المؤقت)', exportProgress: 'تصدير التقدم كملف JSON', importProgress: 'استيراد التقدم من ملف',
    resetProgress: 'تصفير التقدم المحفوظ', resetConfirm: 'هل أنت متأكد من تصفير كل التقدم المحفوظ؟ لا يمكن التراجع عن هذا الإجراء.',
    progressImportSuccess: 'تم استيراد التقدم بنجاح!', progressImportFailed: 'ملف التقدم غير صالح أو تالف.',
    pressureGauge: 'مقياس الضغط', flowMeter: 'مقياس التدفق', pipeDiameterTool: 'أداة قياس القطر', elevationMeter: 'مقياس المنسوب',
    waterLevelSensor: 'حساس مستوى المياه', velocitySensor: 'حساس السرعة', temperatureSensor: 'حساس درجة الحرارة',
    pumpMonitor: 'مراقب المضخة', valveController: 'متحكم الصمامات', leakDetector: 'كاشف التسرب', none: 'لا يوجد',
  },
  en: {
    appName: 'Emergency Engineer', start: 'Start playing', play: 'Choose a stage', about: 'About the game',
    continue: 'Continue', back: 'Back', save: 'Save', cancel: 'Cancel', close: 'Close',
    welcome: 'Welcome', welcomeText: 'Practice reading indicators, weighing evidence, and making responsible engineering decisions.',
    playerName: 'Student name', educationLevel: 'Education level', chooseLevel: 'Choose your study level (optional)',
    levelUnspecified: 'Prefer not to choose yet', levelYear1: 'First year', levelYear2: 'Second year',
    levelYear3: 'Third year', levelMaster: 'Master / Advanced',
    aboutTitle: 'How does the game work?', aboutBody: 'Each stage is an engineering mission. Read the situation, analyze measurements, choose an action, and justify it. Mistakes reduce system health and show learning feedback. Scores follow the stage’s existing rules.',
    aboutProgress: 'Success unlocks the next stage. You can retry and review your best score.',
    aboutTools: 'Tools and parameters support analysis. The map is a visual network representation, not a live hydraulic simulation.',
    skipIntro: 'Skip the guide', overview: 'Command Center', stages: 'Stages', notebook: 'Engineer Notebook',
    eventLog: 'Event Log', tools: 'Tools & Knowledge', achievements: 'Achievements', settings: 'Settings',
    profile: 'Player profile', completed: 'Stages completed', bestScore: 'Best score', averageScore: 'Average score', correctAnswers: 'Correct answers',
    errors: 'Errors', timePlayed: 'Recorded play time', rank: 'Learning rank', addNote: 'Add a note',
    noteTitle: 'Note title', noteBody: 'Write what you learned or want to review', edit: 'Edit', delete: 'Delete',
    noNotes: 'No notes yet.', noEvents: 'Important attempts will appear here.', noTools: 'Complete stages to discover concepts.',
    language: 'Language', arabic: 'العربية', english: 'English', sound: 'Sound effects', music: 'Music',
    on: 'On', off: 'Off', menu: 'Menu', currentStage: 'Current stage', progress: 'Progress', timeRemaining: 'Time remaining',
    unlocked: 'Unlocked', locked: 'Locked', done: 'Completed', stage: 'Stage',
    prerequisites: 'Knowledge for this stage', studyFirst: 'Review the concept, then continue, or start the stage now.',
    studyAndContinue: 'Study and continue', startAnyway: 'Start without studying', studied: 'Reviewed',
    learningLevel: 'Stage level', difficulty: 'Difficulty', concepts: 'Concepts', outcome: 'Learning outcome',
    success: 'Correct answer', wrong: 'Incorrect answer', earned: 'Good work. Continue your analysis.',
    missed: 'Review the evidence and explanation, then try again.', closeToast: 'Close notification',
    zoomIn: 'Zoom in', zoomOut: 'Zoom out', resetMap: 'Reset map view',
    stageCompleted: 'Stage completed', stageFailed: 'Attempt ended', stageUnlocked: 'New stage unlocked',
    firstMission: 'First Mission', fiveMissions: 'Hydraulic Analyst', noMistakes: 'Precise Engineer', finalMission: 'Emergency Engineer',
    noPrerequisiteBlock: 'Prerequisites are for learning, not a lock. You can start this stage at any time.',
    completedCount: 'Stages completed', elapsed: 'Duration', score: 'Score', health: 'System health', budget: 'Budget',
    rankMasterEngineer: 'Master Engineer', rankSeniorEngineer: 'Senior Engineer', rankHydraulicEngineer: 'Hydraulic Engineer', rankJuniorEngineer: 'Junior Engineer', rankTrainingRequired: 'Additional training required',
    arabicStageNotice: 'Some stage-authored content is currently available in Arabic.',
    difficultyBeginner: 'Beginner', difficultyIntermediate: 'Intermediate', difficultyAdvanced: 'Advanced', difficultyExpert: 'Expert',
    noObjective: 'This stage has no objective.', unsupportedObjective: 'This objective type is not supported by the interface yet.',
    chooseOption: 'Choose the best option', chooseMultiple: 'Select all relevant options', submitOptions: 'Check selections',
    enterCalculation: 'Enter the calculated value', valuePlaceholder: 'Value', confirm: 'Confirm', diagnose: 'Diagnose the issue',
    hint: 'Hint', continueStep: 'Continue to step', completedStep: 'Step completed', justificationExcellent: 'Excellent justification — you selected all correct factors without an unsuitable one.',
    selectedPipe: 'Selected pipe', selectedNode: 'Selected node', part: 'Part', diagnosticStep: 'Diagnostic step',
    investigationSummary: 'Investigation Summary', choicesMatchEvidence: 'Selections are consistent with evidence',
    choicesNeedReview: 'Some selections are missing or need review', summaryNote: 'Use this record alongside network readings before confirming your final recommendation.',
    groupBonus: 'Correct group bonus', justificationScoreImpact: 'Justification impact on score',
    justificationCorrectStep: 'Correct justification: you selected the appropriate factors for this step.', selectionBonusResult: 'Selection bonus',
    justificationImpactResult: 'Justification impact', points: 'points', reviewRequired: 'Review Required',
    extraTime: 'Extra time (2x timer limit)', exportProgress: 'Export Progress (JSON)', importProgress: 'Import Progress',
    resetProgress: 'Reset Progress', resetConfirm: 'Are you sure you want to reset all saved progress? This action cannot be undone.',
    progressImportSuccess: 'Progress imported successfully!', progressImportFailed: 'Invalid or corrupt progress file.',
    pressureGauge: 'Pressure Gauge', flowMeter: 'Flow Meter', pipeDiameterTool: 'Pipe Caliper', elevationMeter: 'Elevation Meter',
    waterLevelSensor: 'Water Level Sensor', velocitySensor: 'Velocity Sensor', temperatureSensor: 'Temperature Sensor',
    pumpMonitor: 'Pump Monitor', valveController: 'Valve Controller', leakDetector: 'Leak Detector', none: 'None',
  },
};

let language = getSettings().language === 'en' ? 'en' : 'ar';

export function getLanguage() { return language; }
export function setLanguage(next) {
  language = next === 'en' ? 'en' : 'ar';
  updateSettings({ language });
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('languagechange', { detail: language }));
  }
}
export function t(key) { return STRINGS[language]?.[key] ?? STRINGS.ar[key] ?? key; }
setLanguage(language);
