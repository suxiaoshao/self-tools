import { useEffect, useRef } from 'react';

export default function useTitle(title?: string) {
  const prevTitleRef = useRef(document.title);

  if (document.title !== title && title) document.title = title;

  useEffect(() => {
    return () => {
      document.title = prevTitleRef.current;
    };
  }, []);
}
