import './manual';
import Prism from 'prismjs/components/prism-core';
import 'prismjs/plugins/autoloader/prism-autoloader';
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import 'prism-themes/themes/prism-dracula.css';
import './index.css';

const autoloader = Prism.plugins.autoloader as {
  languages_path: string;
  loadLanguages: (languages: string[], success: () => void, error: () => void) => void;
};
autoloader.languages_path = __PRISM_PATH__;

export async function highlight(container: HTMLElement, current: () => boolean) {
  await Promise.all(
    Array.from(container.querySelectorAll<HTMLElement>('pre code')).map(async (element) => {
      const language =
        __PRISM_ALIASES__[(/\blang(?:uage)?-([\w-]+)\b/i.exec(element.className)?.[1] ?? '').toLowerCase()];
      if (!language) return;
      const loaded = await new Promise<boolean>((resolve) =>
        autoloader.loadLanguages(
          [language],
          () => resolve(true),
          () => resolve(false),
        ),
      );
      if (loaded && current() && container.contains(element)) Prism.highlightElement(element);
    }),
  );
}
