import type { Metadata } from 'next';
import Clubs from '../../components/clubs/clubs';

export const metadata: Metadata = {
  title: 'Tech Clubs at SVCE | SVCE Tech Hub',
  description:
    'Discover every tech club and student chapter at Sri Venkateswara College of Engineering — IEEE, CSI, ACM, IETE, ISTE and more.'
};

export default function ClubsPage() {
  return <Clubs />;
}
