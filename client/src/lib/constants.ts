export const DIFFICULTY_COLORS = {
  easy: 'hsl(142, 76%, 36%)',
  medium: 'hsl(38, 92%, 50%)',
  hard: 'hsl(0, 84%, 60%)',
} as const;

export const BADGE_TYPES = {
  streak_master: {
    title: 'Streak Master',
    description: '7-day streak of 5+ daily problems',
    icon: 'fas fa-fire',
    gradient: 'from-orange-400 to-red-500'
  },
  century_coder: {
    title: 'Century Coder',
    description: '100+ problems solved',
    icon: 'fas fa-code',
    gradient: 'from-green-400 to-emerald-500'
  },
  comeback_coder: {
    title: 'Comeback Coder',
    description: 'Big improvement',
    icon: 'fas fa-chart-line',
    gradient: 'from-purple-400 to-pink-500'
  },
  weekly_topper: {
    title: 'Weekly Topper',
    description: 'Top performer this week',
    icon: 'fas fa-trophy',
    gradient: 'from-yellow-400 to-orange-500'
  }
} as const;

export const STATUS_COLORS = {
  'Excellent': 'bg-green-100 text-green-800',
  'Active': 'bg-blue-100 text-blue-800',
  'Underperforming': 'bg-red-100 text-red-800'
} as const;
