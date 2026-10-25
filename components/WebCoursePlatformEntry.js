import Link from 'next/link';
import AppIcon from './AppIcon';
import useWebCoursePlatform from '../hooks/useWebCoursePlatform';

export default function WebCoursePlatformEntry({ onClick, current = false }) {
  const platform = useWebCoursePlatform();
  if (platform !== 'browser') return null;
  return <Link href="/online-kurse" prefetch={false} onClick={onClick} aria-current={current ? 'page' : undefined}><AppIcon name="video" size={21} />Onlinekurse</Link>;
}
