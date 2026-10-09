import React from 'react';

import { cn } from '@/lib/utils';

const MaxWidthWrapper = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        'mx-auto w-full min-w-0 max-w-screen-xl px-4 md:px-8 lg:px-10',
        className,
      )}
    >
      {children}
    </div>
  );
};

export default MaxWidthWrapper;
