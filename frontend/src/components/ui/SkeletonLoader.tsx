import styles from './SkeletonLoader.module.css';

interface SkeletonLoaderProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export default function SkeletonLoader({ width = '100%', height = '20px', borderRadius = '6px', className }: SkeletonLoaderProps) {
  return (
    <div
      className={`${styles.skeleton} ${className ?? ''}`}
      style={{ width, height, borderRadius }}
    />
  );
}
