import type { Strings } from './en';

export const ru: Strings = {
  tab: {
    today: 'Сегодня',
    inbox: 'Входящие',
    habits: 'Привычки',
    progress: 'Прогресс',
    more: 'Ещё',
  },

  common: {
    save: 'Сохранить',
    cancel: 'Отмена',
    done: 'Готово',
    delete: 'Удалить',
    edit: 'Изменить',
    add: 'Добавить',
    saving: 'Сохраняем…',
    loading: 'Загрузка…',
    refresh: 'Обновить',
    signOut: 'Выйти',
  },

  trial: {
    bannerDays: (n: number) => `Осталось ${n} ${pluralRuDays(n)} пробного периода`,
    bannerExpired: 'Пробный период истёк — подключите подписку',
    upgrade: 'Подключить',
  },
  paywall: {
    title: 'Сохрани свой импульс',
    subtitle: 'Попробуйте Momentum бесплатно 3 дня. Отмена в любой момент.',
    monthly: 'Месяц',
    yearly: 'Год',
    yearlyBadge: 'Скидка 50%',
    perMonth: '/мес',
    perYear: '/год',
    pickPlan: 'Выбрать план',
    refresh: 'Я уже оплатил(а) — обновить статус',
    later: 'Позже',
    pricingNote: 'Оплата через Gumroad. Возврат в течение 7 дней.',
  },

  today: {
    greeting: {
      morning: (name: string) => `Доброе утро${name ? `, ${name}` : ''}`,
      afternoon: (name: string) => `Добрый день${name ? `, ${name}` : ''}`,
      evening: (name: string) => `Добрый вечер${name ? `, ${name}` : ''}`,
    },
    todaysScore: 'Счёт за день',
    checkIns: 'Быстрые отметки',
    topPriorities: 'Главные задачи',
    timeBlocks: 'Блоки времени',
    habitsToday: 'Привычки на сегодня',
    nothingYet: 'Пока ничего — зафиксируй мысль или добавь привычку.',
  },

  more: {
    title: 'Всё остальное под рукой',
    subtitle: 'Дополнительные разделы для планирования, ревью, здоровья, денег и настроек.',
    projects: 'Проекты',
    projectsHint: 'Большие цели',
    areas: 'Сферы',
    areasHint: 'Баланс сфер жизни',
    rituals: 'Ритуалы',
    ritualsHint: 'Вечерний разбор и недельное ревью',
    health: 'Здоровье',
    healthHint: 'Вес, вода, еда',
    money: 'Деньги',
    moneyHint: 'Расходы и бюджет',
    dailyPlans: 'План дня',
    dailyPlansHint: 'Планируй завтра вечером',
    captures: 'Заметки',
    capturesHint: 'Идеи в ожидании действия',
    activity: 'Активность',
    activityHint: 'Всё, что ты отметил',
    settings: 'Настройки',
    settingsHint: 'Предпочтения и аккаунт',
    admin: 'Админ',
    adminHint: 'Доступ пользователям, регистрации',
    signedInAs: 'Вход выполнен как',
    telegramId: 'Telegram ID',
  },

  settings: {
    title: 'Настройки',
    preferences: 'Предпочтения',
    language: 'Язык',
    languageHint: 'Авто из Telegram',
    waterTarget: 'Цель по воде',
    waterTargetHint: 'Стаканов в день',
    sleepTarget: 'Цель по сну',
    sleepTargetHint: 'Часов в сутки',
    currency: 'Валюта',
    weekStart: 'Неделя начинается с',
    dailyPriorities: 'Главных задач в день',
    legal: 'Документы',
    privacy: 'Политика конфиденциальности',
    terms: 'Условия использования',
    account: 'Аккаунт',
    signOutConfirm: 'Выйти?',
  },

  inbox: {
    title: 'Входящие',
    countCaptured: (n: number) => `${n} ${pluralRuCaptures(n)}`,
    mindClear: 'Голова чистая.',
    captureHint: 'Записывай что угодно — задачи, идеи, напоминания, заметки.',
    captureSomething: 'Записать мысль',
    captureTitle: 'Записать',
    capturePlaceholder: 'Что у тебя на уме?',
    promotedToTask: 'превращено в задачу',
    processed: 'обработано',
  },

  habits: {
    title: 'Привычки',
    none: 'Пока нет привычек.',
    addHabit: 'Добавить привычку',
  },

  progress: {
    title: 'Прогресс',
    last7: '7Д',
    last14: '14Д',
    month: 'Месяц',
  },
};

function pluralRuDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
  return 'дней';
}

function pluralRuCaptures(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'запись';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'записи';
  return 'записей';
}
