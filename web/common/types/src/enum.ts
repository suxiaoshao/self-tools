export type Enum<TAG extends string | number, TYPE = undefined> = TYPE extends undefined
  ? {
      tag: TAG;
    }
  : {
      tag: TAG;
      value: TYPE;
    };
