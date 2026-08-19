import LegalPage from '../components/LegalPage';
import { getLegalDoc } from '../lib/legal';

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="What trytaptile.com collects, why, and how to see or correct it."
      path="/privacy"
      body={getLegalDoc('privacy')}
    />
  );
}
