export const en = {
  // Tab bar
  tab: {
    today: 'Today',
    inbox: 'Inbox',
    habits: 'Habits',
    progress: 'Progress',
    more: 'More',
  },

  // Common actions
  common: {
    save: 'Save',
    cancel: 'Cancel',
    done: 'Done',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    saving: 'Saving…',
    loading: 'Loading…',
    refresh: 'Refresh',
    signOut: 'Sign out',
  },

  // Trial banner + paywall
  trial: {
    bannerDays: (n: number) => `${n} day${n === 1 ? '' : 's'} left in trial`,
    bannerExpired: 'Trial expired — upgrade to keep going',
    upgrade: 'Upgrade',
  },
  paywall: {
    title: 'Keep your momentum',
    subtitle: 'Try Momentum free for 3 days. Cancel anytime.',
    monthly: 'Monthly',
    yearly: 'Yearly',
    yearlyBadge: 'Save 50%',
    perMonth: '/mo',
    perYear: '/yr',
    pickPlan: 'Pick a plan',
    refresh: 'I just paid — refresh status',
    later: 'Maybe later',
    pricingNote: 'Billed via Gumroad. 7-day refund.',
  },

  // Today
  today: {
    greeting: {
      morning: (name: string) => `Good morning${name ? `, ${name}` : ''}`,
      afternoon: (name: string) => `Good afternoon${name ? `, ${name}` : ''}`,
      evening: (name: string) => `Good evening${name ? `, ${name}` : ''}`,
    },
    todaysScore: "Today's score",
    checkIns: 'Quick check-ins',
    topPriorities: 'Top priorities',
    timeBlocks: 'Today’s blocks',
    habitsToday: 'Habits today',
    nothingYet: 'Nothing yet — capture something, or add a habit.',
  },

  // More screen
  more: {
    title: 'Everything else, still close',
    subtitle: 'Secondary spaces for deeper planning, reviews, health, money, and preferences.',
    projects: 'Projects',
    projectsHint: 'Track bigger outcomes',
    areas: 'Areas',
    areasHint: 'Balance life domains',
    rituals: 'Rituals',
    ritualsHint: 'Evening shutdown & weekly review',
    health: 'Health',
    healthHint: 'Weight, water, meals',
    money: 'Money',
    moneyHint: 'Expenses & budget',
    dailyPlans: 'Daily Plans',
    dailyPlansHint: 'Plan tomorrow tonight',
    captures: 'Captures',
    capturesHint: 'Ideas waiting for action',
    activity: 'Activity',
    activityHint: 'Everything you logged',
    settings: 'Settings',
    settingsHint: 'Preferences & account',
    admin: 'Admin',
    adminHint: 'Comp users, see signups',
    signedInAs: 'Signed in as',
    telegramId: 'Telegram ID',
  },

  // Settings
  settings: {
    title: 'Settings',
    preferences: 'Preferences',
    language: 'Language',
    languageHint: 'Automatic from Telegram',
    waterTarget: 'Water target',
    waterTargetHint: 'Glasses per day',
    sleepTarget: 'Sleep target',
    sleepTargetHint: 'Hours per night',
    currency: 'Currency',
    weekStart: 'Week starts on',
    dailyPriorities: 'Daily priorities',
    legal: 'Legal',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    account: 'Account',
    signOutConfirm: 'Sign out?',
  },

  // Inbox
  inbox: {
    title: 'Inbox',
    countCaptured: (n: number) => `${n} captured`,
    mindClear: 'Your mind is clear.',
    captureHint: 'Capture anything here — tasks, ideas, reminders, notes.',
    captureSomething: 'Capture something',
    captureTitle: 'Capture',
    capturePlaceholder: "What's on your mind?",
    promotedToTask: 'promoted to task',
    processed: 'processed',
  },

  // Habits
  habits: {
    title: 'Habits',
    none: 'No habits yet.',
    addHabit: 'Add a habit',
  },

  // Progress
  progress: {
    title: 'Progress',
    last7: '7D',
    last14: '14D',
    month: 'Month',
  },
};

export type Strings = typeof en;
