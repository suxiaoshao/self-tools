import { endpoints } from 'runtime-config';

export function getImageUrl(url: string) {
  return `${endpoints.imageProxy}?${new URLSearchParams({ url })}`;
}
