import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cake } from "lucide-react";
import { useBirthdays } from "@/hooks/useBirthdays";

interface BirthdayWidgetProps {
  customers: any[];
  onShowBirthdays?: (filter: 'today' | 'upcoming' | 'thisMonth') => void;
}

export const BirthdayWidget = ({ customers, onShowBirthdays }: BirthdayWidgetProps) => {
  const { birthdayStats } = useBirthdays(customers);
  
  const totalBirthdays = birthdayStats.todayCount + birthdayStats.upcomingCount;

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onShowBirthdays?.('thisMonth')}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
          <Cake className="h-4 w-4 text-pink-600" />
          Aniversariantes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{birthdayStats.thisMonthCount}</div>
        {totalBirthdays > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            {birthdayStats.todayCount > 0 && `${birthdayStats.todayCount} hoje`}
            {birthdayStats.todayCount > 0 && birthdayStats.upcomingCount > 0 && " • "}
            {birthdayStats.upcomingCount > 0 && `${birthdayStats.upcomingCount} próximos`}
          </div>
        )}
      </CardContent>
    </Card>
  );
};