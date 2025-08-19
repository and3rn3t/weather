import React, { useEffect, useState } from 'react';

const OverlayDiagnostic: React.FC = () => {
  const [overlayElements, setOverlayElements] = useState<Element[]>([]);

  useEffect(() => {
    const findOverlayElements = () => {
      const elements = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        const isFixed = style.position === 'fixed';
        const isAbsolute = style.position === 'absolute';
        const hasHighZIndex = parseInt(style.zIndex) > 999;
        const coversScreen =
          style.width === '100%' ||
          style.width === '100vw' ||
          style.height === '100%' ||
          style.height === '100vh';

        return (isFixed || isAbsolute) && (hasHighZIndex || coversScreen);
      });

      setOverlayElements(elements);
    };

    findOverlayElements();

    // Update every 2 seconds
    const interval = setInterval(findOverlayElements, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 99999,
        fontSize: '12px',
        maxWidth: '300px',
        maxHeight: '200px',
        overflow: 'auto',
      }}
    >
      <h4>Overlay Diagnostic</h4>
      <p>Found {overlayElements.length} potential overlay elements:</p>
      {overlayElements.map((el, index) => (
        <div
          key={`${el.tagName}-${index}-${el.className || 'no-class'}`}
          style={{ marginBottom: '5px' }}
        >
          <strong>{el.tagName}</strong>
          {el.className && ` .${el.className}`}
          {el.id && ` #${el.id}`}
          <br />
          <small>
            pos: {window.getComputedStyle(el).position}, z:{' '}
            {window.getComputedStyle(el).zIndex}
          </small>
        </div>
      ))}
    </div>
  );
};

export default OverlayDiagnostic;
