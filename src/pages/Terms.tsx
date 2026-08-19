import LegalPage from '../components/LegalPage';
import { getLegalDoc } from '../lib/legal';

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      description="What you're agreeing to by using trytaptile.com — plainly stated."
      path="/terms"
      body={getLegalDoc('terms')}
    />
  );
}
