import type { CSSProperties, ReactNode } from "react";

type Props = {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export default function A4Paper({ className, style, children }: Props) {
  return (
    <div className={("a4-page " + (className || "")).trim()} style={style}>
      {children}
    </div>
  );
}
