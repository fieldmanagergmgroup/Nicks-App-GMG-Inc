export const formatDateString = (dateStr?: string): string | null => {
  if (!dateStr) return null;

  const date = new Date(dateStr + 'T00:00:00'); // Ensure it's parsed as local time
  if (isNaN(date.getTime())) return null;

  const day = date.getDate();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const getDayWithSuffix = (d: number) => {
    if (d > 3 && d < 21) return d + 'th';
    switch (d % 10) {
      case 1: return d + 'st';
      case 2: return d + 'nd';
      case 3: return d + 'rd';
      default: return d + 'th';
    }
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);
  const parts = formattedDate.replace(',', '').split(' ');
  
  // Intl returns "October 10, 2023", we want to replace "10" with "10th"
  const dayWithSuffix = getDayWithSuffix(day);
  
  // Reconstruct the string: "Tuesday, October 10th, 2023"
  return `${parts[0]}, ${parts[1]} ${dayWithSuffix}, ${parts[3]}`;
};
