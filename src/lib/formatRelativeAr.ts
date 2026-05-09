export function formatRelativeAr(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'الآن';

  const diffM = Math.floor(diffMs / 60000);
  if (diffM < 1) return 'الآن';
  if (diffM < 60) return `منذ ${diffM} دقيقة`;

  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `منذ ${diffH} ساعة`;

  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.floor((startOf(now) - startOf(date)) / 86400000);
  if (dayDiff === 1) return 'أمس';
  if (dayDiff < 7) return `منذ ${dayDiff} أيام`;

  return date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
}
