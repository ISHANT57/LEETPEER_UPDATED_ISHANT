import { Link, useLocation } from "wouter";
import { Code, Users, Trophy, Medal, Calendar, LogOut, Activity, BarChart3, TrendingUp, Building2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "All Students",
    href: "/",
    icon: Users,
  },
  {
    name: "University Dashboard",
    href: "/university",
    icon: Building2,
  },
  {
    name: "Batch 2027",
    href: "/batch/2027",
    icon: BookOpen,
  },
  {
    name: "Batch 2028",
    href: "/batch/2028",
    icon: BookOpen,
  },
  {
    name: "Real-Time Tracker",
    href: "/tracker",
    icon: Activity,
  },
  {
    name: "Admin Dashboard",
    href: "/admin",
    icon: Code,
  },
  {
    name: "Leaderboard",
    href: "/leaderboard",
    icon: Trophy,
  },
  {
    name: "Badges",
    href: "/badges",
    icon: Medal,
  },
  {
    name: "Analytics Dashboard",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Weekly Progress",
    href: "/weekly-progress",
    icon: TrendingUp,
  },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 flex flex-col shadow-2xl">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
            <Code className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">LeetCode Tracker</h1>
            <p className="text-sm text-slate-400">Batch Analytics Platform</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item, index) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href === "/" && location === "/");
          
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer group animate-fade-in hover-lift",
                isActive 
                  ? "bg-gradient-primary text-white shadow-lg" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )} style={{ animationDelay: `${index * 0.1}s` }}>
                <Icon size={18} className={cn(
                  "transition-transform duration-200",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} />
                <span className="font-semibold">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3 p-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors duration-200 cursor-pointer">
          <img 
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=40&h=40" 
            alt="User profile" 
            className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500 shadow-lg" 
          />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Admin Panel</p>
            <p className="text-xs text-slate-400">Management View</p>
          </div>
          <button className="text-slate-400 hover:text-white transition-colors duration-200">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
