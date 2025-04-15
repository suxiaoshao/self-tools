/* eslint-disable no-console no-fallthrough */
export function proxy<T>(source: T): T {
  switch (typeof source) {
    case 'object':
    case 'function': {
      if (source !== null) {
        return new Proxy(source, {
          get(target, p) {
            console.log('get', target, p);
            return proxy(Reflect.get(target, p));
          },
          apply(target, thisArg, argArray) {
            console.log('apply', target, thisArg, argArray);
            return Reflect.apply(target as () => void, thisArg, argArray);
          },
          construct(target, argArray, newTarget) {
            console.log('new', target, argArray, newTarget);
            return Reflect.construct(target as () => void, argArray, newTarget);
          },
          // eslint-disable-next-line max-params
          set(target, p, newValue, receiver) {
            console.log('set', target, p, newValue);
            return Reflect.set(target, p, newValue, receiver);
          },
          defineProperty(target, property, attributes) {
            console.log('defineProperty', target, property, attributes);
            return Reflect.defineProperty(target, property, attributes);
          },
          deleteProperty(target, p) {
            console.log('deleteProperty', target, p);
            return Reflect.deleteProperty(target, p);
          },
          getOwnPropertyDescriptor(target, p) {
            console.log('getOwnPropertyDescriptor', target, p);
            return Reflect.getOwnPropertyDescriptor(target, p);
          },
          getPrototypeOf(target) {
            console.log('getPrototypeOf', target);
            return Reflect.getPrototypeOf(target);
          },
          has(target, p) {
            console.log('has', target, p);
            return Reflect.has(target, p);
          },
          isExtensible(target) {
            console.log('isExtensible', target);
            return Reflect.isExtensible(target);
          },
          ownKeys(target) {
            console.log('ownKeys', target);
            return Reflect.ownKeys(target);
          },
          preventExtensions(target) {
            console.log('preventExtensions', target);
            return Reflect.preventExtensions(target);
          },
          setPrototypeOf(target, v) {
            console.log('setPrototypeOf', target, v);
            return Reflect.setPrototypeOf(target, v);
          },
        });
      }
    }
    default: {
      return source;
    }
  }
}
