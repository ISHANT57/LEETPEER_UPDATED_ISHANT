import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, TrendingDown, Calendar, Users, RefreshCw, Target } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

interface WeeklyProgress {
  student: {
    id: string;
    name: string;
    leetcodeUsername: string;
    profilePhoto?: string;
    batch: string;
  };
  weekStarting: string;
  problemsSolved: number;
  improvement: number;
  streakDays: number;
  difficultyBreakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export default function WeeklyProgressPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: weeklyData, isLoading, error, refetch } = useQuery<WeeklyProgress[]>({
    queryKey: ['/api/weekly-progress'],
  });

  const filteredData = weeklyData?.filter(progress =>
    progress.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    progress.student.leetcodeUsername.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Calculate summary stats
  const summaryStats = weeklyData ? {
    totalStudents: weeklyData.length,
    totalProblems: weeklyData.reduce((sum, p) => sum + p.problemsSolved, 0),
    averageProblems: Math.round(weeklyData.reduce((sum, p) => sum + p.problemsSolved, 0) / weeklyData.length),
    improving: weeklyData.filter(p => p.improvement > 0).length,
    declining: weeklyData.filter(p => p.improvement < 0).length
  } : null;

  if (error) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading weekly progress</h3>
          <p className="text-red-600 text-sm mt-1">Failed to load weekly progress data.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-slate-200 rounded-2xl loading-shimmer"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-xl loading-shimmer"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-xl loading-shimmer"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!weeklyData || weeklyData.length === 0) {
    return (
      <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative px-6 py-16">
            <div className="text-center animate-fade-in">
              <div className="mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mx-auto">
                  <Calendar className="text-white" size={32} />
                </div>
              </div>
              <h1 className="text-5xl font-bold text-white mb-4">Weekly Progress</h1>
              <p className="text-white/90 text-xl max-w-2xl mx-auto">
                No weekly progress data available yet
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative px-6 py-16">
          <div className="flex justify-between items-center animate-fade-in">
            <div>
              <div className="mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Calendar className="text-white" size={32} />
                </div>
              </div>
              <h1 className="text-5xl font-bold text-white mb-4">Weekly Progress Tracking</h1>
              <p className="text-white/90 text-xl max-w-2xl">
                Monitor student performance and improvement trends week by week
              </p>
              <div className="text-white/80 text-sm mt-2">
                Analyzing {summaryStats?.totalStudents} students with {summaryStats?.totalProblems} problems solved this week
              </div>
            </div>
            
            <div className="flex gap-3 animate-slide-in-right">
              <Button 
                onClick={() => refetch()}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8 -mt-8">
        {/* Summary Stats */}
        {summaryStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card className="modern-card hover-lift bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-0 shadow-xl animate-fade-in">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto mb-3 text-blue-500" />
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{summaryStats.totalStudents}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Students</p>
              </CardContent>
            </Card>

            <Card className="modern-card hover-lift bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-0 shadow-xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{summaryStats.totalProblems}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Problems</p>
              </CardContent>
            </Card>

            <Card className="modern-card hover-lift bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-0 shadow-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-6 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-cyan-500" />
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{summaryStats.averageProblems}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Average per Student</p>
              </CardContent>
            </Card>

            <Card className="modern-card hover-lift bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-0 shadow-xl animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{summaryStats.improving}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Improving</p>
              </CardContent>
            </Card>

            <Card className="modern-card hover-lift bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-0 shadow-xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <CardContent className="p-6 text-center">
                <TrendingDown className="h-12 w-12 mx-auto mb-3 text-red-500" />
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{summaryStats.declining}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Need Support</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Weekly Progress List */}
        <Card className="modern-card border-0 shadow-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm animate-fade-in">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 rounded-t-2xl border-b border-cyan-200 dark:border-cyan-800">
            <CardTitle className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              Weekly Performance Overview
              <Badge className="ml-auto bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300">
                {filteredData.length} students
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search students by name or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 text-lg bg-white dark:bg-slate-800 border-0 shadow-lg rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredData.map((progress, index) => (
                <div 
                  key={progress.student.id}
                  className="flex items-center justify-between p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center space-x-6">
                    <Avatar className="w-16 h-16 ring-2 ring-white dark:ring-slate-700 shadow-lg">
                      {progress.student.profilePhoto && (
                        <AvatarImage src={progress.student.profilePhoto} alt={progress.student.name} />
                      )}
                      <AvatarFallback className="bg-gradient-primary text-white font-bold text-lg">
                        {progress.student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-bold text-xl text-slate-900 dark:text-white">{progress.student.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">@{progress.student.leetcodeUsername}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge className={`${
                          progress.student.batch === '2027' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                        }`}>
                          Batch {progress.student.batch}
                        </Badge>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          Week of {new Date(progress.weekStarting).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-2">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">{progress.problemsSolved}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Problems Solved</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          progress.improvement > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                          progress.improvement < 0 ? 'text-red-600 dark:text-red-400' :
                          'text-slate-600 dark:text-slate-400'
                        }`}>
                          {progress.improvement > 0 ? '+' : ''}{progress.improvement}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Change</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{progress.streakDays}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Streak Days</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Badge className="difficulty-easy px-2 py-1 text-xs font-semibold rounded-full">
                        Easy: {progress.difficultyBreakdown.easy}
                      </Badge>
                      <Badge className="difficulty-medium px-2 py-1 text-xs font-semibold rounded-full">
                        Medium: {progress.difficultyBreakdown.medium}
                      </Badge>
                      <Badge className="difficulty-hard px-2 py-1 text-xs font-semibold rounded-full">
                        Hard: {progress.difficultyBreakdown.hard}
                      </Badge>
                    </div>
                    
                    <div className="mt-2">
                      <Link href={`/student/${progress.student.leetcodeUsername}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredData.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">No progress data found</h3>
                <p className="text-slate-500 dark:text-slate-500">
                  {searchTerm ? 'Try adjusting your search criteria' : 'No weekly progress data available yet'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}