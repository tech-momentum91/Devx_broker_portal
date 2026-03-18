import React from 'react';
import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';
import PageHeader from '@/components/page-header';
import { cn } from '@/utils/cn';

const PageLayout = ({
  children,
  pageTitle,
  pageIcon,
  pageDescription,
  rightActions,
  headerActions,
  fullWidth = false, // when true, page content spans full width (no centered container)
}) => {
  return (
    <div className='w-dvw h-dvh flex'>

      {/* Main Content Area */}
      <div className='flex-1 h-full flex flex-col overflow-y-auto transition-all duration-200 ease-out'>
        {/* Top navigation bar */}
        <Navbar />

        {/* Page header (dynamic) */}
        <PageHeader
          pageIcon={pageIcon}
          pageTitle={pageTitle}
          pageDescription={pageDescription}
          rightActions={headerActions ?? rightActions}
        />
        <main className='w-full h-full overflow-y-auto'>
          {fullWidth ? (
            children
          ) : (
            <div className='max-w-7xl mx-auto px-6 w-full'>
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PageLayout;
