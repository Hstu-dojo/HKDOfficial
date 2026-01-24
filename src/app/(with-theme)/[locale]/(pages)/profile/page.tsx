import { redirect } from 'next/navigation';

// Redirect old profile page to the new unified dashboard/profile settings
export default function ProfileRedirectPage() {
  redirect('/dashboard/profile');
}
