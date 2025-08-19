/// <reference types="react" />
/// <reference types="react-dom" />

// React JSX namespace for TypeScript
import type { FC, ComponentType, ReactElement } from 'react';

declare global {
  namespace JSX {
    type Element = ReactElement;
    
    interface IntrinsicElements {
      [elemName: string]: React.DetailedHTMLProps<React.AllHTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
