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