const DAY = 86_400_000;

export function localDay(now = new Date()) {
  const localTime = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return new Date(localTime).toISOString().slice(0, 10);
}

export function addDays(day, count) {
  return new Date(Date.parse(day) + count * DAY).toISOString().slice(0, 10);
}

export function nextCharge(start, cycle, today) {
  if (start >= today) return start;

  const [year, month, day] = start.split('-').map(Number);
  const [currentYear, currentMonth] = today.split('-').map(Number);
  const period = cycle === 'year' ? 12 : 1;
  let offset = Math.floor(((currentYear - year) * 12 + currentMonth - month) / period) * period;

  function atOffset(months) {
    const lastDay = new Date(Date.UTC(year, month + months, 0)).getUTCDate();
    return new Date(Date.UTC(year, month - 1 + months, Math.min(day, lastDay)))
      .toISOString().slice(0, 10);
  }

  const candidate = atOffset(offset);
  return candidate >= today ? candidate : atOffset(offset + period);
}

export function summarize(subscriptions, today) {
  const boundary = addDays(today, 7);
  const rows = subscriptions.map(entry => ({
    ...entry, next: nextCharge(entry.date, entry.cycle, today),
  })).sort((a, b) => a.next.localeCompare(b.next) || a.name.localeCompare(b.name, 'ru'));

  const yearly = rows.reduce((sum, entry) => sum + entry.cents * (entry.cycle === 'month' ? 12 : 1), 0);
  const upcoming = rows.reduce((sum, entry) => sum + (entry.next < boundary ? entry.cents : 0), 0);
  return { rows, monthly: Math.round(yearly / 12), yearly, upcoming };
}
