import React, { useState, useRef, useEffect } from 'react';

function Tooltip({ children, text, placement = 'top' }) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (show && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let top, left;
      
      switch (placement) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 8;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + 8;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.left - tooltipRect.width - 8;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.right + 8;
          break;
        default:
          top = triggerRect.top - tooltipRect.height - 8;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
      }
      
      // Keep tooltip within viewport
      if (left < 5) left = 5;
      if (left + tooltipRect.width > window.innerWidth - 5) {
        left = window.innerWidth - tooltipRect.width - 5;
      }
      if (top < 5) {
        top = triggerRect.bottom + 8; // Flip to bottom if no room on top
      }
      
      setPosition({ top, left });
    }
  }, [show, placement]);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        style={{ display: 'inline-block' }}
      >
        {children}
      </span>
      {show && (
        <div
          ref={tooltipRef}
          className="tooltip bs-tooltip-auto fade show"
          role="tooltip"
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          <div className="tooltip-arrow" style={{
            position: 'absolute',
            ...(placement === 'top' ? { bottom: '-6px', left: '50%', transform: 'translateX(-50%)' } : {}),
            ...(placement === 'bottom' ? { top: '-6px', left: '50%', transform: 'translateX(-50%)' } : {}),
            ...(placement === 'left' ? { right: '-6px', top: '50%', transform: 'translateY(-50%)' } : {}),
            ...(placement === 'right' ? { left: '-6px', top: '50%', transform: 'translateY(-50%)' } : {})
          }}></div>
          <div className="tooltip-inner">{text}</div>
        </div>
      )}
    </>
  );
}

export default Tooltip;
