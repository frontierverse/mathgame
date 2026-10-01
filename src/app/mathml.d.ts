import type { DetailedHTMLProps, HTMLAttributes } from "react";

type MathElementProps = DetailedHTMLProps<HTMLAttributes<MathMLElement>, MathMLElement> & {
  xmlns?: string;
  stretchy?: "true" | "false";
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      math: MathElementProps;
      mrow: MathElementProps;
      mo: MathElementProps;
      mn: MathElementProps;
      mfrac: MathElementProps;
    }
  }
}
