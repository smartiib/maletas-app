import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Gift, Users, Cake } from "lucide-react";
import { useBirthdays } from "@/hooks/useBirthdays";
import { getBirthdayInfo } from "@/utils/dateUtils";

interface BirthdayWidgetProps {
  customers: any[];
  onShowBirthdays: (filter: 'today' | 'upcoming' | 'thisMonth') => void;
}

export const BirthdayWidget = ({ customers, onShowBirthdays }: BirthdayWidgetProps) => {
  const { birthdayStats } = useBirthdays(customers);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Cake className="h-5 w-5 text-primary" />
          Aniversariantes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas principais */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
              {birthdayStats.todayCount}
            </div>
            <div className="text-xs text-muted-foreground">Hoje</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {birthdayStats.upcomingCount}
            </div>
            <div className="text-xs text-muted-foreground">Próximos 7d</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {birthdayStats.thisMonthCount}
            </div>
            <div className="text-xs text-muted-foreground">Este mês</div>
          </div>
        </div>

        {/* Aniversariantes de hoje */}
        {birthdayStats.todayCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-pink-600" />
              <span className="text-sm font-medium text-pink-700 dark:text-pink-300">
                Aniversário hoje! 🎉
              </span>
            </div>
            <div className="space-y-1">
              {birthdayStats.customersToday.slice(0, 3).map((customer) => {
                const birthdayInfo = getBirthdayInfo(customer);
                const name = customer.first_name && customer.last_name 
                  ? `${customer.first_name} ${customer.last_name}`.trim()
                  : customer.first_name || customer.last_name || customer.email;
                
                return (
                  <div key={customer.id} className="flex items-center justify-between p-2 bg-white/60 dark:bg-black/20 rounded">
                    <span className="text-sm font-medium">{name}</span>
                    {birthdayInfo.age && (
                      <Badge variant="secondary" className="text-xs">
                        {birthdayInfo.age} anos
                      </Badge>
                    )}
                  </div>
                );
              })}
              {birthdayStats.todayCount > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{birthdayStats.todayCount - 3} mais...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Próximos aniversários */}
        {birthdayStats.upcomingCount > 0 && birthdayStats.todayCount === 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Próximos aniversários
              </span>
            </div>
            <div className="space-y-1">
              {birthdayStats.customersUpcoming.slice(0, 3).map((customer) => {
                const birthdayInfo = getBirthdayInfo(customer);
                const name = customer.first_name && customer.last_name 
                  ? `${customer.first_name} ${customer.last_name}`.trim()
                  : customer.first_name || customer.last_name || customer.email;
                
                return (
                  <div key={customer.id} className="flex items-center justify-between p-2 bg-white/60 dark:bg-black/20 rounded">
                    <span className="text-sm">{name}</span>
                    <Badge variant="outline" className="text-xs">
                      {birthdayInfo.daysUntilBirthday === 1 ? 'Amanhã' : `${birthdayInfo.daysUntilBirthday} dias`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex gap-2 pt-2">
          {birthdayStats.todayCount > 0 && (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 text-pink-600 border-pink-200 hover:bg-pink-50"
              onClick={() => onShowBirthdays('today')}
            >
              Ver hoje
            </Button>
          )}
          {birthdayStats.upcomingCount > 0 && (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 text-purple-600 border-purple-200 hover:bg-purple-50"
              onClick={() => onShowBirthdays('upcoming')}
            >
              Próximos
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            onClick={() => onShowBirthdays('thisMonth')}
          >
            Este mês
          </Button>
        </div>

        {/* Mensagem quando não há aniversários */}
        {birthdayStats.todayCount === 0 && birthdayStats.upcomingCount === 0 && birthdayStats.thisMonthCount === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum aniversário próximo</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};