import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download App | Kaizen Karate Academy',
  description: 'Download the Kaizen Karate Academy mobile application to access your tutorials and certificates on the go.',
};

export default function APKDownloadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
