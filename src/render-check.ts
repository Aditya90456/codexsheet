import { renderToStaticMarkup } from "react-dom/server";
import CsLabs from "./CsLabs";

export function renderCase(props: Record<string, unknown>) {
  return renderToStaticMarkup(
    CsLabs as unknown as React.ComponentType<Record<string, unknown>>,
    props
  );
}
