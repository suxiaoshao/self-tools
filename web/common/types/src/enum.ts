export type Enum<TAG extends string, TYPE = undefined> = TYPE extends undefined
  ? {
      tag: TAG;
    }
  : {
      tag: TAG;
      value: TYPE;
    };
