import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { RefreshCw, Search, Trophy, TrendingUp, ExternalLink, Users, Clock, Activity, Target, Flame } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface StudentRanking {
  rank: number;
  student: {
    id: string;
    name: string;
    leetcodeUsername: string;
    leetcodeProfileLink: string;
    profilePhoto?: string;
  };
  stats: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    ranking: number;
    acceptanceRate: number;
    totalSubmissions: number;
    totalAccepted: number;
  };
  weeklyProgress: number;
  streak: number;
  status: string;
  badges: number;
}

export default function RealTimeTracker() {
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const { toast } = useToast();

  const { data: rankings, isLoading, refetch, isRefetching } = useQuery<StudentRanking[]>({
    queryKey: ['/api/rankings/all'],
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds
  });

  const { data: adminData } = useQuery<{
    totalStudents: number;
    activeStudents: number;
    totalProblems: number;
    underperforming: number;
  }>({
    queryKey: ['/api/dashboard/admin'],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  useEffect(() => {
    if (!isRefetching) {
      setLastSync(new Date());
    }
  }, [isRefetching]);

  const handleManualRefresh = async () => {
    await refetch();
    toast({
      title: "Data refreshed",
      description: "All student rankings have been updated.",
    });
  };

  const handleFullSync = async () => {
    try {
      await apiRequest('POST', '/api/sync/all');
      await refetch();
      toast({
        title: "Full sync completed",
        description: "All student data has been synchronized with LeetCode.",
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Failed to sync with LeetCode. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="text-yellow-500" size={20} />;
    if (rank === 2) return <Trophy className="text-slate-400" size={20} />;
    if (rank === 3) return <Trophy className="text-amber-600" size={20} />;
    return null;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-600';
    if (rank === 2) return 'bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-700 dark:to-gray-700 border-2 border-slate-300 dark:border-slate-500';
    if (rank === 3) return 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-300 dark:border-amber-600';
    return 'bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600';
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'excellent':
        return 'status-excellent';
      case 'good':
        return 'status-good';
      case 'active':
        return 'status-active';
      default:
        return 'status-underperforming';
    }
  };

  const filteredRankings = rankings?.filter(ranking =>
    ranking.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ranking.student.leetcodeUsername.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-slate-200 rounded-2xl loading-shimmer"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-xl loading-shimmer"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-200 rounded-xl loading-shimmer"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative px-6 py-16">
          <div className="flex justify-between items-center animate-fade-in">
            <div>
              <div className="mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Activity className="text-white" size={32} />
                </div>
              </div>
              <h1 className="text-5xl font-bold text-white mb-4">Real-Time Tracker</h1>
              <p className="text-white/90 text-xl max-w-2xl">
                Live student rankings and performance monitoring
              </p>
              <div className="text-white/80 text-sm mt-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Last updated: {lastSync.toLocaleTimeString()}
                {isRefetching && <span className="animate-pulse">• Refreshing...</span>}
              </div>
            </div>
            
            <div className="flex gap-3 animate-slide-in-right">
              <Button 
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm ${autoRefresh ? 'ring-2 ring-white/50' : ''}`}
                variant="outline"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh
              </Button>
              <Button 
                onClick={handleManualRefresh}
                disabled={isRefetching}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                variant="outline"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button 
                onClick={handleFullSync}
                className="bg-white text-emerald-600 hover:bg-white/90 font-semibold"
              >
                <Target className="mr-2 h-4 w-4" />
                Full Sync
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8 -mt-8">
        {/* Stats Cards */}
        {adminData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="modern-card hover-lift bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-0 shadow-xl animate-fade-in">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto mb-3 text-blue-500" />
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{adminData.totalStudents}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Students</p>
              </CardContent>
            </Card>

            <Card className="modern-card hover-lift bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-0 shadow-xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <CardContent className="p-6 text-center">
                <Activity className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{adminData.activeStudents}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Students</p>
              </CardContent>
            </Card>

            <Card className="modern-card hover-lift bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-0 shadow-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{adminData.totalProblems}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Problems Solved</p>
              </CardContent>
            </Card>

            <Card className="modern-card hover-lift bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-0 shadow-xl animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-red-500" />
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{adminData.underperforming}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Need Support</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Rankings Table */}
        <Card className="modern-card border-0 shadow-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm animate-fade-in">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-t-2xl border-b border-emerald-200 dark:border-emerald-800">
            <CardTitle className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-xl flex items-center justify-center">
                <Trophy className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              Live Rankings
              <Badge className="ml-auto bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                {filteredRankings?.length || 0} students
              </Badge>
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              Real-time student performance rankings with auto-refresh every 30 seconds
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search students by name or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 text-lg bg-white dark:bg-slate-800 border-0 shadow-lg rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {filteredRankings && filteredRankings.length > 0 ? (
              <div className="space-y-2">
                {filteredRankings.map((ranking, index) => (
                  <div 
                    key={ranking.student.id}
                    className={`flex items-center justify-between p-6 rounded-2xl transition-all duration-300 hover:shadow-lg animate-slide-up ${getRankStyle(ranking.rank)}`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center gap-3">
                        {getRankIcon(ranking.rank)}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${
                          ranking.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' : 
                          ranking.rank === 2 ? 'bg-gradient-to-r from-slate-300 to-slate-400 text-white' : 
                          ranking.rank === 3 ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white' :
                          'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
                        }`}>
                          {ranking.rank}
                        </div>
                      </div>
                      
                      <Avatar className="w-12 h-12 ring-2 ring-white dark:ring-slate-700 shadow-lg">
                        {ranking.student.profilePhoto && (
                          <AvatarImage src={ranking.student.profilePhoto} alt={ranking.student.name} />
                        )}
                        <AvatarFallback className="bg-gradient-primary text-white font-semibold text-sm">
                          {ranking.student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{ranking.student.name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">@{ranking.student.leetcodeUsername}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{ranking.streak} day streak</span>
                          </div>
                          <Badge className={getStatusBadge(ranking.status)}>
                            {ranking.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">{ranking.stats.totalSolved}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">Problems Solved</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">+{ranking.weeklyProgress}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">This Week</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Badge className="difficulty-easy px-2 py-1 text-xs font-semibold rounded-full">
                          E: {ranking.stats.easySolved}
                        </Badge>
                        <Badge className="difficulty-medium px-2 py-1 text-xs font-semibold rounded-full">
                          M: {ranking.stats.mediumSolved}
                        </Badge>
                        <Badge className="difficulty-hard px-2 py-1 text-xs font-semibold rounded-full">
                          H: {ranking.stats.hardSolved}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link href={`/student/${ranking.student.leetcodeUsername}`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            View Profile <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">No rankings found</h3>
                <p className="text-slate-500 dark:text-slate-500">
                  {searchTerm ? 'Try adjusting your search criteria' : 'No student data available yet'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}