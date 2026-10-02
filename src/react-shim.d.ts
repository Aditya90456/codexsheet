declare module "react" {
  export type ReactNode = unknown;
  export type FormEvent<T = HTMLFormElement> = { preventDefault(): void; target: T };
  export function useState<S>(initialState: S | (() => S)): [S, (next: S | ((current: S) => S)) => void];
  export function useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, dependencies: readonly unknown[]): T;
  export function StrictMode(props: { children?: ReactNode }): unknown;
}

declare module "react-dom/client" {
  export function createRoot(container: Element | DocumentFragment): { render(children: unknown): void };
}

declare module "react/jsx-runtime" {
  export function jsx(type: unknown, props: unknown, key?: unknown): unknown;
  export function jsxs(type: unknown, props: unknown, key?: unknown): unknown;
  export const Fragment: unknown;
}

declare namespace JSX {
  interface IntrinsicElements {
    [element: string]: {
      [property: string]: unknown;
      onChange?: (event: { target: { value: string } }) => void;
      onSubmit?: (event: import("react").FormEvent<HTMLFormElement>) => void;
      onMouseDown?: (event: { stopPropagation(): void }) => void;
    };
  }
}
