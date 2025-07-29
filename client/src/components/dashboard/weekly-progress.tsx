import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { StudentDashboardData } from "@shared/schema";

interface WeeklyProgressProps {
  data: StudentDashboardData;
}

export default function WeeklyProgress({ data }: WeeklyProgressProps) {
  const chartData = data.weeklyProgress.map((value, index) => ({
    week: `Week ${index + 1}`,
    problems: value,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                dataKey="week" 
                stroke="#64748B"
                fontSize={12}
              />
              <YAxis 
                stroke="#64748B"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="problems" 
                stroke="hsl(207, 90%, 54%)"
                strokeWidth={2}
                dot={{ fill: 'hsl(207, 90%, 54%)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(207, 90%, 54%)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
