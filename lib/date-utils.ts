/** ルート期間中の月リストを返す */
export function getMonthColumns(startDate: string, months: number) {
  const d = new Date(startDate);
  const result: { year: number; month: number; label: string; start: Date; end: Date }[] = [];

  for (let i = 0; i < months; i++) {
    const year = d.getFullYear();
    const month = d.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0); // 月末

    result.push({
      year,
      month: month + 1,
      label: `${month + 1}月`,
      start,
      end,
    });

    d.setMonth(d.getMonth() + 1);
  }

  return result;
}

/** ルート全体の開始日・終了日を返す */
export function getRouteDateRange(startDate: string, months: number) {
  const start = new Date(startDate);
  // 開始月の1日から
  const routeStart = new Date(start.getFullYear(), start.getMonth(), 1);
  // months 後の月末
  const endD = new Date(start.getFullYear(), start.getMonth() + months, 0);
  return { routeStart, routeEnd: endD };
}

/** 日付がルート範囲内での割合(0〜1)を返す */
export function dateToPercent(date: string, routeStart: Date, totalDays: number) {
  const d = new Date(date);
  const diff = (d.getTime() - routeStart.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.min(1, diff / totalDays)) * 100;
}

/** ルートの総日数 */
export function getTotalDays(routeStart: Date, routeEnd: Date) {
  return (routeEnd.getTime() - routeStart.getTime()) / (1000 * 60 * 60 * 24);
}

/** N ヶ月後の日付(ISO文字列) */
export function addMonths(dateStr: string, n: number) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + n);
  return toISODate(d);
}

/** Date → yyyy-mm-dd */
export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 短い日付表示（3/15 等） */
export function shortDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 今日の年月1日を返す */
export function thisMonthFirst() {
  const now = new Date();
  return toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
}

/** ルート期間中の週リストを返す（7日刻み、W1から連番） */
export function getWeekColumns(routeStart: Date, routeEnd: Date, totalDays: number) {
  const result: { week: number; leftPercent: number; widthPercent: number }[] = [];
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  let weekStart = new Date(routeStart);
  let w = 1;

  while (weekStart < routeEnd) {
    const weekEnd = new Date(weekStart.getTime() + 7 * MS_PER_DAY);
    const clampedEnd = weekEnd > routeEnd ? routeEnd : weekEnd;

    const startDay = (weekStart.getTime() - routeStart.getTime()) / MS_PER_DAY;
    const endDay = (clampedEnd.getTime() - routeStart.getTime()) / MS_PER_DAY;

    result.push({
      week: w,
      leftPercent: (startDay / totalDays) * 100,
      widthPercent: ((endDay - startDay) / totalDays) * 100,
    });

    weekStart = weekEnd;
    w++;
  }

  return result;
}
