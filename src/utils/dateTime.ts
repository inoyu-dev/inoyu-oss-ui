export const formatDateTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}; 