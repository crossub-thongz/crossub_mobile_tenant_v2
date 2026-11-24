import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/theme';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const VIEW = { DAYS: 'days', MONTHS: 'months', YEARS: 'years' } as const;
const YEAR_PAGE = 12;
const YEAR_ANCHOR = 2020;

type CalendarView = (typeof VIEW)[keyof typeof VIEW];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function dateValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function label(value: string): string {
  const date = parseDate(value);
  if (!date) return '';
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function yearPageStart(year: number): number {
  return YEAR_ANCHOR + Math.floor((year - YEAR_ANCHOR) / YEAR_PAGE) * YEAR_PAGE;
}

/** The admin portal calendar: Monday first, dd/mm/yyyy, today and clear, then months and years. */
export function DatePickerField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const selected = parseDate(value);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<CalendarView>(VIEW.DAYS);
  const [month, setMonth] = useState(() => selected ?? new Date());
  const [yearStart, setYearStart] = useState(() => yearPageStart((selected ?? new Date()).getFullYear()));
  const today = new Date();
  const todayValue = dateValue(today);

  const openCalendar = () => {
    const shown = selected ?? new Date();
    setMonth(shown);
    setYearStart(yearPageStart(shown.getFullYear()));
    setView(VIEW.DAYS);
    setOpen((current) => !current);
  };

  const pickDay = (day: Date) => {
    onChange(dateValue(day));
    setOpen(false);
  };

  return (
    <View style={styles.wrap}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open calendar" onPress={openCalendar} style={styles.trigger}>
        <Text style={[styles.triggerText, !label(value) && styles.placeholder]}>{label(value) || 'dd/mm/yyyy'}</Text>
        <Ionicons name="calendar-outline" size={18} color={colors.muted} />
      </Pressable>
      {open ? (
        <View style={styles.panel}>
          {view === VIEW.DAYS ? (
            <Days
              month={month}
              selected={selected}
              today={today}
              onPrevious={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              onNext={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              onCaption={() => setView(VIEW.MONTHS)}
              onPick={pickDay}
            />
          ) : null}
          {view === VIEW.MONTHS ? (
            <Months
              month={month}
              selected={selected}
              today={today}
              onPrevious={() => setMonth(new Date(month.getFullYear() - 1, month.getMonth(), 1))}
              onNext={() => setMonth(new Date(month.getFullYear() + 1, month.getMonth(), 1))}
              onCaption={() => {
                setYearStart(yearPageStart(month.getFullYear()));
                setView(VIEW.YEARS);
              }}
              onPick={(monthIndex) => {
                setMonth(new Date(month.getFullYear(), monthIndex, 1));
                setView(VIEW.DAYS);
              }}
            />
          ) : null}
          {view === VIEW.YEARS ? (
            <Years
              start={yearStart}
              selected={selected}
              todayYear={today.getFullYear()}
              onPrevious={() => setYearStart(yearStart - YEAR_PAGE)}
              onNext={() => setYearStart(yearStart + YEAR_PAGE)}
              onPick={(year) => {
                setMonth(new Date(year, month.getMonth(), 1));
                setView(VIEW.MONTHS);
              }}
            />
          ) : null}
          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onChange(todayValue);
                setOpen(false);
              }}
              style={styles.today}
            >
              <Text style={styles.todayText}>Today</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onChange('');
                setOpen(false);
              }}
            >
              <Text style={styles.clear}>Clear</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Header({
  caption,
  onCaption,
  previousLabel,
  nextLabel,
  onPrevious,
  onNext,
}: {
  caption: string;
  onCaption?: () => void;
  previousLabel: string;
  nextLabel: string;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel={previousLabel} onPress={onPrevious} style={styles.nav}>
        <Ionicons name="chevron-back" size={18} color={colors.ink} />
      </Pressable>
      {onCaption ? (
        <Pressable accessibilityRole="button" onPress={onCaption} style={styles.captionHit}>
          <Text style={styles.caption}>{caption}</Text>
        </Pressable>
      ) : (
        <Text style={styles.caption}>{caption}</Text>
      )}
      <Pressable accessibilityRole="button" accessibilityLabel={nextLabel} onPress={onNext} style={styles.nav}>
        <Ionicons name="chevron-forward" size={18} color={colors.ink} />
      </Pressable>
    </View>
  );
}

function Days({
  month,
  selected,
  today,
  onPrevious,
  onNext,
  onCaption,
  onPick,
}: {
  month: Date;
  selected: Date | null;
  today: Date;
  onPrevious: () => void;
  onNext: () => void;
  onCaption: () => void;
  onPick: (day: Date) => void;
}) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const count = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<number | null> = [...Array(firstWeekday).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  return (
    <View>
      <Header
        caption={`${MONTHS[monthIndex]} ${year}`}
        onCaption={onCaption}
        previousLabel="Previous month"
        nextLabel="Next month"
        onPrevious={onPrevious}
        onNext={onNext}
      />
      <View style={styles.week}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekday}>
            {day}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (!day) return <View key={`blank-${index}`} style={styles.cell} />;
          const date = new Date(year, monthIndex, day);
          const isSelected = selected?.getFullYear() === year && selected.getMonth() === monthIndex && selected.getDate() === day;
          const isToday = today.getFullYear() === year && today.getMonth() === monthIndex && today.getDate() === day;
          return (
            <Pressable key={day} accessibilityRole="button" onPress={() => onPick(date)} style={[styles.cell, isToday && styles.todayCell, isSelected && styles.selectedCell]}>
              <Text style={[styles.cellText, isSelected && styles.selectedText]}>{day}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Months({
  month,
  selected,
  today,
  onPrevious,
  onNext,
  onCaption,
  onPick,
}: {
  month: Date;
  selected: Date | null;
  today: Date;
  onPrevious: () => void;
  onNext: () => void;
  onCaption: () => void;
  onPick: (monthIndex: number) => void;
}) {
  const year = month.getFullYear();
  return (
    <View>
      <Header caption={String(year)} onCaption={onCaption} previousLabel="Previous year" nextLabel="Next year" onPrevious={onPrevious} onNext={onNext} />
      <View style={styles.grid3}>
        {MONTHS_SHORT.map((name, monthIndex) => {
          const isSelected = selected?.getFullYear() === year && selected.getMonth() === monthIndex;
          const isCurrent = today.getFullYear() === year && today.getMonth() === monthIndex;
          return (
            <Pressable key={name} accessibilityRole="button" onPress={() => onPick(monthIndex)} style={[styles.wideCell, isCurrent && styles.todayCell, isSelected && styles.selectedCell]}>
              <Text style={[styles.cellText, isSelected && styles.selectedText]}>{name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Years({
  start,
  selected,
  todayYear,
  onPrevious,
  onNext,
  onPick,
}: {
  start: number;
  selected: Date | null;
  todayYear: number;
  onPrevious: () => void;
  onNext: () => void;
  onPick: (year: number) => void;
}) {
  const years = Array.from({ length: YEAR_PAGE }, (_, index) => start + index);
  return (
    <View>
      <Header caption={`${years[0]} – ${years[years.length - 1]}`} previousLabel="Previous years" nextLabel="Next years" onPrevious={onPrevious} onNext={onNext} />
      <View style={styles.grid3}>
        {years.map((year) => {
          const isSelected = selected?.getFullYear() === year;
          const isCurrent = todayYear === year;
          return (
            <Pressable key={year} accessibilityRole="button" onPress={() => onPick(year)} style={[styles.wideCell, isCurrent && styles.todayCell, isSelected && styles.selectedCell]}>
              <Text style={[styles.cellText, isSelected && styles.selectedText]}>{year}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  trigger: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 16,
    borderColor: '#e4eeea',
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: { color: colors.ink, fontSize: 14 },
  placeholder: { color: '#8b9b90' },
  panel: { borderWidth: 1, borderColor: colors.line, borderRadius: 16, backgroundColor: colors.card, padding: 8, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 36 },
  nav: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  captionHit: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  caption: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', color: colors.muted, fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  grid3: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: { width: '14.285%', height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  wideCell: { width: '31%', height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  todayCell: { backgroundColor: colors.greenSoft },
  selectedCell: { backgroundColor: colors.green },
  cellText: { color: colors.ink, fontSize: 13 },
  selectedText: { color: '#fff', fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 },
  today: { backgroundColor: colors.greenSoft, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  todayText: { color: colors.greenDark, fontSize: 13, fontWeight: '700' },
  clear: { color: colors.green, fontSize: 13, fontWeight: '700' },
});
