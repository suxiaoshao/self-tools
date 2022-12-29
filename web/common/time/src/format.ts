import { Dayjs, dayjs } from './index';

/** 格式化时间 */
export function format(timestamp?: string | number | Date | Dayjs | null | undefined): string {
  if (timestamp == null || timestamp == undefined) {
    return '~';
  }
  const time = dayjs(timestamp);

  return time.format('YYYY-M-D HH:mm:ss');
}
