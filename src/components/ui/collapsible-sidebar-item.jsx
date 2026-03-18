import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { RiArrowDownSLine, RiArrowUpSLine, RiBuilding2Line } from 'react-icons/ri';

const CollapsibleSidebarItem = ({
  parentIcon = <RiBuilding2Line size={20} />,
  parentLabel = 'Centers',
  parentPath = '/centers',
  childItems = [{ label: 'Team Management', path: '/team-management' }],
  handleCollapseItem,
  collapsedItems,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const itemKey = parentPath;

  // Check if this item is currently collapsed
  const isCollapsed = collapsedItems[itemKey] || false;

  // Check if parent path is active
  const isParentActive = (path) => {
    const currentPath = location.pathname;
    if (currentPath === path) {
      return true;
    }
    if (currentPath.startsWith(`${path}/`)) {
      return true;
    }
    return false;
  };

  // Check if any child is active
  const isAnyChildActive = childItems.some((child) => {
    const currentPath = location.pathname;
    if (currentPath === child.path) {
      return true;
    }
    if (currentPath.startsWith(`${child.path}/`)) {
      return true;
    }
    return false;
  });

  // Parent is active if its path is active OR any child is active
  const isActive = isParentActive(parentPath);

  // Handle parent click - navigate to parent path
  const handleParentClick = (e) => {
    e.stopPropagation();
    navigate(parentPath);
  };

  // Handle arrow click - toggle collapse state
  const handleArrowClick = (e) => {
    e.stopPropagation();
    handleCollapseItem(itemKey);
  };

  // Handle child click - navigate to child path
  const handleChildClick = (e, childPath) => {
    e.stopPropagation();
    navigate(childPath);
  };

  // Check if child path is active
  const isChildActive = (childPath) => {
    const currentPath = location.pathname;
    if (currentPath === childPath) {
      return true;
    }
    if (currentPath.startsWith(`${childPath}/`)) {
      return true;
    }
    return false;
  };

  return (
    <div className='w-full flex flex-col'>
      <div
        className={cn(
          'relative w-full rounded-[8px] gap-3 py-[8px] h-full flex items-center justify-between px-[12px]',
          isActive ? 'bg-bg-weak-100 text-text-main-900' : 'bg-transparent text-text-sub-500',
          'hover:cursor-pointer',
        )}
      >
        {isActive && (
          <div
            className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full',
              'bg-primary-base',
            )}
            aria-hidden='true'
          />
        )}
        <div className='flex items-center gap-2 flex-1' onClick={handleParentClick}>
          <div
            className={
              isActive ? 'text-[var(--color-primary-base)]' : 'text-[var(--color-text-sub-500)]'
            }
          >
            {parentIcon}
          </div>
          <span
            className={
              isActive ? 'text-[var(--color-primary-base)]' : 'text-[var(--color-text-sub-500)]'
            }
          >
            {parentLabel}
          </span>
        </div>
        <div
          onClick={handleArrowClick}
          className={cn(
            'transition-transform duration-200 cursor-pointer',
            isCollapsed ? 'rotate-180' : 'rotate-0',
            isActive ? 'text-[var(--color-primary-base)]' : 'text-[var(--color-text-sub-500)]',
          )}
        >
          <RiArrowUpSLine />
        </div>
      </div>

      {/* Child Items - shown when not collapsed */}
      {!isCollapsed && childItems && childItems.length > 0 && (
        <div className='w-full flex flex-col mt-1 ml-5.5'>
          {childItems.map((child) => {
            const childIsActive = isChildActive(child.path);
            return (
              <div
                key={child.path}
                onClick={(e) => handleChildClick(e, child.path)}
                className={cn(
                  'relative w-full rounded-[8px] gap-3 py-[8px] h-full flex items-center px-[12px]',
                  childIsActive ? ' text-text-main-900' : 'bg-transparent text-text-sub-500',
                  'hover:cursor-pointer',
                )}
              >
                {childIsActive && (
                  <div
                    className={cn(
                      'absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full',
                      'bg-primary-base',
                    )}
                    aria-hidden='true'
                  />
                )}
                <div className='flex items-center gap-2'>
                  <span
                    className={cn(
                      childIsActive
                        ? 'text-[var(--color-primary-base)]'
                        : 'text-[var(--color-text-main-900)]',
                    )}
                  >
                    {child.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSidebarItem;
