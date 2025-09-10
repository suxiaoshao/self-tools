import { type Dayjs, dayjs } from './init';

/** 格式化时间 */
export function format(timestamp?: string | number | Date | Dayjs | null): string {
  if (timestamp === null || timestamp === undefined) {
    return '~';
  }
  const time = dayjs(timestamp);

  return time.format('YYYY-MM-DD HH:mm:ss');
}
