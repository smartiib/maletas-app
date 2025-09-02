import { format, isToday, isSameMonth, isSameYear, differenceInYears, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface BirthdayInfo {
  date: Date | null;
  age: number | null;
  isToday: boolean;
  isThisMonth: boolean;
  daysUntilBirthday: number | null;
  formatted: string;
}

/**
 * Extrai data de nascimento do objeto billing ou meta_data do cliente WooCommerce
 */
export const extractBirthdate = (customer: any): Date | null => {
  try {
    // Tenta extrair do billing.birthdate primeiro
    if (customer.billing?.birthdate) {
      const date = new Date(customer.billing.birthdate);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Tenta extrair do meta_data
    if (Array.isArray(customer.meta_data)) {
      const birthdateField = customer.meta_data.find((meta: any) => 
        meta.key === 'birthdate' || 
        meta.key === 'birth_date' || 
        meta.key === 'date_of_birth' ||
        meta.key === '_birthdate'
      );
      
      if (birthdateField?.value) {
        const date = new Date(birthdateField.value);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    return null;
  } catch (error) {
    console.warn('Erro ao extrair data de nascimento:', error);
    return null;
  }
};

/**
 * Calcula idade baseada na data de nascimento
 */
export const calculateAge = (birthdate: Date): number | null => {
  try {
    if (!birthdate || isNaN(birthdate.getTime())) return null;
    return differenceInYears(new Date(), birthdate);
  } catch (error) {
    return null;
  }
};

/**
 * Verifica se é aniversário hoje
 */
export const isBirthdayToday = (birthdate: Date): boolean => {
  try {
    if (!birthdate) return false;
    const today = new Date();
    return birthdate.getDate() === today.getDate() && 
           birthdate.getMonth() === today.getMonth();
  } catch (error) {
    return false;
  }
};

/**
 * Verifica se é aniversário neste mês
 */
export const isBirthdayThisMonth = (birthdate: Date): boolean => {
  try {
    if (!birthdate) return false;
    const today = new Date();
    return birthdate.getMonth() === today.getMonth();
  } catch (error) {
    return false;
  }
};

/**
 * Calcula quantos dias faltam para o próximo aniversário
 */
export const daysUntilBirthday = (birthdate: Date): number | null => {
  try {
    if (!birthdate) return null;
    
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Cria data do aniversário no ano atual
    let nextBirthday = new Date(currentYear, birthdate.getMonth(), birthdate.getDate());
    
    // Se já passou este ano, usa o próximo ano
    if (nextBirthday < today) {
      nextBirthday = new Date(currentYear + 1, birthdate.getMonth(), birthdate.getDate());
    }
    
    const diffTime = nextBirthday.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    return null;
  }
};

/**
 * Retorna informações completas de aniversário para um cliente
 */
export const getBirthdayInfo = (customer: any): BirthdayInfo => {
  const birthdate = extractBirthdate(customer);
  
  if (!birthdate) {
    return {
      date: null,
      age: null,
      isToday: false,
      isThisMonth: false,
      daysUntilBirthday: null,
      formatted: ''
    };
  }

  const age = calculateAge(birthdate);
  const isToday = isBirthdayToday(birthdate);
  const isThisMonth = isBirthdayThisMonth(birthdate);
  const daysUntil = daysUntilBirthday(birthdate);
  
  return {
    date: birthdate,
    age,
    isToday,
    isThisMonth,
    daysUntilBirthday: daysUntil,
    formatted: format(birthdate, 'dd/MM/yyyy', { locale: ptBR })
  };
};

/**
 * Filtra clientes por mês de aniversário
 */
export const filterCustomersByBirthdayMonth = (customers: any[], month: number, year?: number): any[] => {
  return customers.filter(customer => {
    const birthdate = extractBirthdate(customer);
    if (!birthdate) return false;
    
    const birthdayMonth = birthdate.getMonth();
    
    if (year) {
      // Se ano especificado, verifica também o ano
      return birthdayMonth === month && birthdate.getFullYear() === year;
    }
    
    // Apenas mês
    return birthdayMonth === month;
  });
};

/**
 * Filtra clientes com aniversário hoje
 */
export const filterCustomersWithBirthdayToday = (customers: any[]): any[] => {
  return customers.filter(customer => {
    const birthdate = extractBirthdate(customer);
    return birthdate && isBirthdayToday(birthdate);
  });
};

/**
 * Filtra clientes com aniversário nos próximos X dias
 */
export const filterCustomersWithUpcomingBirthdays = (customers: any[], days: number): any[] => {
  return customers.filter(customer => {
    const birthdate = extractBirthdate(customer);
    if (!birthdate) return false;
    
    const daysUntil = daysUntilBirthday(birthdate);
    return daysUntil !== null && daysUntil >= 0 && daysUntil <= days;
  });
};

/**
 * Ordena clientes por proximidade do aniversário
 */
export const sortCustomersByUpcomingBirthday = (customers: any[]): any[] => {
  return [...customers].sort((a, b) => {
    const birthdateA = extractBirthdate(a);
    const birthdateB = extractBirthdate(b);
    
    if (!birthdateA && !birthdateB) return 0;
    if (!birthdateA) return 1;
    if (!birthdateB) return -1;
    
    const daysA = daysUntilBirthday(birthdateA) || 999;
    const daysB = daysUntilBirthday(birthdateB) || 999;
    
    return daysA - daysB;
  });
};

/**
 * Formata lista de meses para seletor
 */
export const getMonthOptions = () => {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2024, i, 1), 'MMMM', { locale: ptBR })
  }));
};