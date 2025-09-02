import { useMemo } from 'react';
import { 
  getBirthdayInfo, 
  filterCustomersWithBirthdayToday,
  filterCustomersWithUpcomingBirthdays,
  filterCustomersByBirthdayMonth,
  sortCustomersByUpcomingBirthday
} from '@/utils/dateUtils';

export interface BirthdayStats {
  todayCount: number;
  thisMonthCount: number;
  upcomingCount: number;
  customersToday: any[];
  customersThisMonth: any[];
  customersUpcoming: any[];
}

export interface BirthdayFilters {
  month?: number;
  year?: number;
  showTodayOnly?: boolean;
  showUpcoming?: boolean;
  upcomingDays?: number;
}

export const useBirthdays = (customers: any[] = []) => {
  // Estatísticas de aniversários
  const birthdayStats: BirthdayStats = useMemo(() => {
    const customersToday = filterCustomersWithBirthdayToday(customers);
    const customersUpcoming = filterCustomersWithUpcomingBirthdays(customers, 7);
    const currentMonth = new Date().getMonth();
    const customersThisMonth = filterCustomersByBirthdayMonth(customers, currentMonth);

    return {
      todayCount: customersToday.length,
      thisMonthCount: customersThisMonth.length,
      upcomingCount: customersUpcoming.length,
      customersToday,
      customersThisMonth,
      customersUpcoming
    };
  }, [customers]);

  // Função para obter aniversariantes de hoje
  const getBirthdaysToday = () => {
    return filterCustomersWithBirthdayToday(customers);
  };

  // Função para obter aniversariantes do mês atual
  const getBirthdaysThisMonth = () => {
    const currentMonth = new Date().getMonth();
    return filterCustomersByBirthdayMonth(customers, currentMonth);
  };

  // Função para obter próximos aniversários
  const getUpcomingBirthdays = (days: number = 7) => {
    return filterCustomersWithUpcomingBirthdays(customers, days);
  };

  // Função para obter aniversariantes por mês específico
  const getBirthdaysByMonth = (month: number, year?: number) => {
    return filterCustomersByBirthdayMonth(customers, month, year);
  };

  // Função para filtrar clientes com base nos filtros de aniversário
  const filterCustomersByBirthday = (filters: BirthdayFilters) => {
    let filtered = [...customers];

    if (filters.showTodayOnly) {
      filtered = filterCustomersWithBirthdayToday(filtered);
    } else if (filters.showUpcoming) {
      const days = filters.upcomingDays || 7;
      filtered = filterCustomersWithUpcomingBirthdays(filtered, days);
    } else if (filters.month !== undefined) {
      filtered = filterCustomersByBirthdayMonth(filtered, filters.month, filters.year);
    }

    return sortCustomersByUpcomingBirthday(filtered);
  };

  // Função para obter informações de aniversário de um cliente específico
  const getCustomerBirthdayInfo = (customer: any) => {
    return getBirthdayInfo(customer);
  };

  // Função para verificar se um cliente tem aniversário
  const hasValidBirthdate = (customer: any) => {
    const info = getBirthdayInfo(customer);
    return info.date !== null;
  };

  // Função para obter clientes com dados de aniversário válidos
  const getCustomersWithBirthdays = () => {
    return customers.filter(hasValidBirthdate);
  };

  // Função para gerar dados para campanhas de email
  const prepareBirthdayCampaignData = (targetCustomers: any[]) => {
    return targetCustomers.map(customer => {
      const birthdayInfo = getBirthdayInfo(customer);
      return {
        ...customer,
        birthdayInfo,
        name: customer.first_name && customer.last_name 
          ? `${customer.first_name} ${customer.last_name}`.trim()
          : customer.first_name || customer.last_name || customer.email,
      };
    });
  };

  return {
    birthdayStats,
    getBirthdaysToday,
    getBirthdaysThisMonth,
    getUpcomingBirthdays,
    getBirthdaysByMonth,
    filterCustomersByBirthday,
    getCustomerBirthdayInfo,
    hasValidBirthdate,
    getCustomersWithBirthdays,
    prepareBirthdayCampaignData,
    
    // Dados processados
    customersWithBirthdays: getCustomersWithBirthdays(),
    sortedByUpcoming: sortCustomersByUpcomingBirthday(customers)
  };
};