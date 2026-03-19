import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download App | HKD Dojo',
  description: 'Download the HKD Dojo mobile application to access your tutorials and certificates on the go.',
};

export default function APKDownloadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
