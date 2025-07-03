import { ReactNode } from 'react';
import './RotatingButton.css';

interface RotatingButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  href?: string;
}

const RotatingButton = ({ children, onClick, className = '', href }: RotatingButtonProps) => {
  const buttonContent = (
    <div className={`rotating-button ${className}`}>
      <div>
        <div>{children}</div>
        <div>{children}</div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="inline-block">
        {buttonContent}
      </a>
    );
  }

  return (
    <button onClick={onClick} type="button" className="inline-block">
      {buttonContent}
    </button>
  );
};

export default RotatingButton;
