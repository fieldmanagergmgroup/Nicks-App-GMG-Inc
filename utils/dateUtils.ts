
export const getWeekRange = (date: Date = new Date()): { start: Date, end: Date } => {
    const d = new Date(date);
    const day = d.getDay(); // Sunday - 0, Monday - 1, ..., Saturday - 6
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    
    const start = new Date(d.setDate(diffToMonday));
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
};

export const isBusinessDay = (date: Date): boolean => {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 is Sunday, 6 is Saturday
};

export const addBusinessDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result)) {
      added++;
    }
  }
  return result;
};

export const getBusinessDaysDiff = (startDate: Date, endDate: Date): number => {
    // Clone to avoid modifying originals
    let current = new Date(startDate);
    current.setHours(0,0,0,0);
    const end = new Date(endDate);
    end.setHours(0,0,0,0);
    
    if (current > end) return 0;

    let count = 0;
    while (current < end) {
        current.setDate(current.getDate() + 1);
        if (isBusinessDay(current)) {
            count++;
        }
    }
    return count;
};

export const getBusinessDaysRemainingInMonth = (date: Date): number => {
    let current = new Date(date);
    const month = current.getMonth();
    let count = 0;
    
    // Move to next day to start counting "remaining"
    current.setDate(current.getDate() + 1);

    while (current.getMonth() === month) {
        if (isBusinessDay(current)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
};

export const getStartOfBusinessWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
};
