import React from 'react';

const PageHeader = ({ pageIcon, pageTitle, pageDescription, rightActions }) => {
  return (
    <div className="w-full bg-bg-white-0">
      <div className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          {pageIcon && <div className="text-primary-base mt-1">{pageIcon}</div>}
          <div>
            {pageTitle && <h1 className="text-2xl font-semibold text-text-main-900">{pageTitle}</h1>}
            {pageDescription && (
              <p className="text-sm text-text-sub-500 mt-1 max-w-xl">
                {pageDescription}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {rightActions}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;

