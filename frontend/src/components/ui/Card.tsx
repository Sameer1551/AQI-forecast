import type { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className, hover = false, onClick }: CardProps) {
  return (
    <div className={`${styles.card} ${hover ? styles.hover : ''} ${className ?? ''}`} onClick={onClick}>
      {children}
    </div>
  );
}
