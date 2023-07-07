import config, { AppConfig } from './config';

export async function loadConfig() {
  const promises = config.apps.map((app) => {
    return fetch(app.configPath).then((res) => res.json()) as Promise<AppConfig>;
  });

  return await Promise.all(promises);
}
