import { Badge } from "@/components/ui/badge";
import { Cake, Calendar } from "lucide-react";
import { getBirthdayInfo } from "@/utils/dateUtils";

interface CustomerBirthdayBadgeProps {
  customer: any;
  variant?: 'default' | 'compact';
}

export const CustomerBirthdayBadge = ({ customer, variant = 'default' }: CustomerBirthdayBadgeProps) => {
  const birthdayInfo = getBirthdayInfo(customer);

  if (!birthdayInfo.date) return null;

  // Aniversário hoje
  if (birthdayInfo.isToday) {
    return (
      <Badge 
        className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0 animate-pulse"
        variant="default"
      >
        <Cake className="h-3 w-3 mr-1" />
        {variant === 'compact' ? 'Hoje!' : 'Aniversário hoje! 🎉'}
      </Badge>
    );
  }

  // Próximos aniversários (7 dias)
  if (birthdayInfo.daysUntilBirthday !== null && birthdayInfo.daysUntilBirthday <= 7 && birthdayInfo.daysUntilBirthday > 0) {
    return (
      <Badge 
        variant="secondary" 
        className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
      >
        <Calendar className="h-3 w-3 mr-1" />
        {birthdayInfo.daysUntilBirthday === 1 
          ? (variant === 'compact' ? 'Amanhã' : '🎂 Amanhã')
          : (variant === 'compact' ? `${birthdayInfo.daysUntilBirthday}d` : `🎂 ${birthdayInfo.daysUntilBirthday} dias`)
        }
      </Badge>
    );
  }

  // Aniversário este mês (mas não nos próximos 7 dias)
  if (birthdayInfo.isThisMonth) {
    return (
      <Badge 
        variant="outline" 
        className="text-indigo-600 border-indigo-200 dark:text-indigo-400 dark:border-indigo-800"
      >
        <Cake className="h-3 w-3 mr-1" />
        {variant === 'compact' ? 'Este mês' : 'Aniversário este mês'}
      </Badge>
    );
  }

  return null;
};