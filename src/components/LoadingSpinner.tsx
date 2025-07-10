import React from 'react';

interface LoadingSpinnerProps {
  size?: string;
  speed?: string;
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = "40", 
  speed = "2.5", 
  color = "#8b5cf6",
  className = ""
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className="leapfrog-loader"
        style={{
          '--size': `${size}px`,
          '--speed': `${speed}s`,
          '--color': color,
          width: `${size}px`,
          height: `${size}px`,
          position: 'relative',
          display: 'inline-block'
        } as React.CSSProperties}
      >
        <div className="leapfrog-dot leapfrog-dot-1"></div>
        <div className="leapfrog-dot leapfrog-dot-2"></div>
        <div className="leapfrog-dot leapfrog-dot-3"></div>
      </div>
      
      <style jsx>{`
        .leapfrog-loader {
          animation: leapfrog-rotate var(--speed) linear infinite;
        }
        
        .leapfrog-dot {
          position: absolute;
          width: calc(var(--size) * 0.2);
          height: calc(var(--size) * 0.2);
          background-color: var(--color);
          border-radius: 50%;
          animation: leapfrog-jump var(--speed) ease-in-out infinite;
        }
        
        .leapfrog-dot-1 {
          left: 0;
          animation-delay: 0s;
        }
        
        .leapfrog-dot-2 {
          left: calc(var(--size) * 0.4);
          animation-delay: calc(var(--speed) / 3);
        }
        
        .leapfrog-dot-3 {
          left: calc(var(--size) * 0.8);
          animation-delay: calc(var(--speed) / 3 * 2);
        }
        
        @keyframes leapfrog-jump {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(calc(var(--size) * -0.5));
          }
        }
        
        @keyframes leapfrog-rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};