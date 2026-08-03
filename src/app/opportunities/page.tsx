import type { Metadata } from 'next';
import Opportunities from '../../components/opportunities/opportunities';

export const metadata: Metadata = {
  title: 'Opportunities | SVCE Tech Hub',
  description:
    'Internships, hackathons, research positions and jobs for students around Sri Venkateswara College of Engineering.'
};

export default function OpportunitiesPage() {
  return <Opportunities />;
}
