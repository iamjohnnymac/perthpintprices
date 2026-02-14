import { Pub } from '@/types/pub';

export function isHappyHourNow(pub: Pub): boolean {
  if (!pub.happyHour) return false;

  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDay = days[now.getDay()];

  if (!pub.happyHour.days.includes(currentDay)) return false;

  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = pub.happyHour.start.split(':').map(Number);
  const [endHour, endMin] = pub.happyHour.end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  return currentTime >= startTime && currentTime <= endTime;
}