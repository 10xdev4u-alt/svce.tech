import type { Metadata } from 'next';
import Resources from '../../components/resources/resources';

export const metadata: Metadata = {
  title: 'Resources | SVCE Tech Hub',
  description:
    'Job fairs, off-campus portals, DSA and interview prep, resume builders and free courses — hand-picked resources for students around Sri Venkateswara College of Engineering.'
};

export default function ResourcesPage() {
  return <Resources />;
}
