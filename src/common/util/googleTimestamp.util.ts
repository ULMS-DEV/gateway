export function toTimestamp(date: Date): google.protobuf.Timestamp {
    const millis = date.getTime();
    return {
      seconds: Math.floor(millis / 1000),
      nanos: (millis % 1000) * 1_000_000,
    };
}

export function fromTimestamp(ts: { seconds: number; nanos?: number }): Date {
    const millis = ts.seconds * 1000 + Math.floor((ts.nanos ?? 0) / 1_000_000);
    return new Date(millis);
}

export function convertDates(value: any): any {
    if (value instanceof Date) {
        return toTimestamp(value);
    }
    if (Array.isArray(value)) {
        return value.map(v => convertDates(v));
    }
    if (value && typeof value === 'object') {
        const out: any = {};
        for (const [k, v] of Object.entries(value)) {
            out[k] = convertDates(v);
        }
        return out;
    }
    return value;
}

export function restoreDates(value: any): any {
  if (value instanceof Object && 'seconds' in value) {
    return fromTimestamp(value as { seconds: number; nanos?: number });
  }

  if (Array.isArray(value)) {
    return value.map(v => restoreDates(v));
  }

  if (value && typeof value === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = restoreDates(v);
    }
    return out;
  }
  return value;
}