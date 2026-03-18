import React, { useState, useCallback, useMemo } from 'react';
import * as Drawer from '@/components/ui/drawer';
import * as Avatar from '@/components/ui/avatar';
import * as CompactButton from '@/components/ui/compact-button';
import * as Dropdown from '@/components/ui/dropdown';
import logo from '@/assets/svgs/Layer.svg';
import closeLogo from '@/assets/images/Layer.png';
import NavItem from '@/components/ui/nav-item';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { logOutService } from '@/services/auth-service';
import { useDispatch, useSelector } from 'react-redux';
import { logoutSuccess } from '@/redux/authSlice';
import * as Badge from '@/components/ui/badge';
import { upperFirst } from 'lodash';
import {
  RiLogoutBoxLine,
  RiSettings2Line,
  RiLayoutGridLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiInbox2Line,
} from 'react-icons/ri';
import { sidebar } from '@/utils/sidebarPerm';
import { cn } from '@/utils/cn';
import inboxStaticData from '@/data/inbox-static-data.json';
import * as Tooltip from '@/components/ui/tooltip';
import { getRole } from '@/utils/user-role-utils';

const Seperator = () => {
  return <div className='h-px mb-[12px] w-full bg-[var(--color-stroke-soft-200)]' />;
};

// Optimized NavItem with Tooltip wrapper
const NavItemWithTooltip = ({
  isDrawerOpen,
  children,
  tooltipContent,
  rightContent,
  ...navItemProps
}) => {
  const navItem = (
    <NavItem {...navItemProps} rightContent={rightContent}>
      {children}
    </NavItem>
  );
  if (isDrawerOpen) {
    return navItem;
  }

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <div className='w-full'>{navItem}</div>
      </Tooltip.Trigger>
      <Tooltip.Content>{tooltipContent}</Tooltip.Content>
    </Tooltip.Root>
  );
};

// Optimized Logo component
const LogoSection = ({ isDrawerOpen, toggleDrawer }) => (
  <div className='h-12 w-full flex items-center justify-center'>
    {isDrawerOpen ? (
      <div className='flex-1 text-label-lg text-text-strong-950'>
        <img src={logo} alt='Logo' />
      </div>
    ) : (
      <div className='flex-1 w-[100px] flex items-center justify-center h-[100px] text-label-lg text-text-strong-950'>
        <img src={closeLogo} alt='Logo' />
      </div>
    )}
    {isDrawerOpen && (
      <CompactButton.Root
        variant='ghost'
        size='large'
        onClick={toggleDrawer}
        className='cursor-pointer'
      >
        <CompactButton.Icon
          className={cn(
            'border border-stroke-soft-200 text-text-sub-500 rounded-[4px] cursor-pointer transition-transform duration-200',
          )}
          as={RiArrowLeftSLine}
        />
      </CompactButton.Root>
    )}
  </div>
);

// Optimized User Profile section
const UserProfileSection = ({ isDrawerOpen, user, handleLogout, userSideBarPerm }) => {
  // Get initials: first letter of first name + last letter of last name
  const getProfileInitials = () => {
    const fullName = user?.full_name || '';
    if (!fullName) return '';

    const nameParts = fullName.trim().split(' ').filter(Boolean);
    if (nameParts.length === 0) return '';
    const firstName = nameParts[0];
    const lastName = nameParts.length == 1 ? '' : nameParts.at(-1);

    // Use lodash upperFirst to capitalize first letter, then get the first character
    const firstLetter = upperFirst(firstName)[0] || '';
    const lastLetter = lastName ? upperFirst(lastName)[0] || '' : '';

    return firstLetter + lastLetter;
  };

  const hasProfileImage = Boolean(
    (user?.profile_image || user?.user_image) &&
      (user.profile_image || user.user_image).trim() !== '',
  );

  return (
    <div className='w-full flex flex-col items-center justify-center gap-2'>
      <div className='rounded-[8px] w-full flex flex-col items-center justify-center gap-2'>
        <Dropdown.Root>
          <Dropdown.Trigger asChild>
            <div
              className={cn(
                'cursor-pointer hover:bg-bg-weak-100 flex items-center w-full gap-3',
                isDrawerOpen ? 'justify-between rounded-[8px]' : 'justify-center rounded-full',
              )}
            >
              <div
                className={cn(
                  'flex items-center gap-2',
                  isDrawerOpen ? 'w-full min-w-0' : 'justify-center',
                )}
              >
                {hasProfileImage ? (
                  <Avatar.Root size={48}>
                    <Avatar.Image src={user.profile_image || user.user_image} alt='Avatar' />
                  </Avatar.Root>
                ) : (
                  <Avatar.Root size={48} color='gray'>
                    <span className='text-label-lg font-medium text-text-main-900'>
                      {getProfileInitials()}
                    </span>
                  </Avatar.Root>
                )}
                {isDrawerOpen && (
                  <div className='gap-1 flex flex-col items-start justify-start flex-1 min-w-0'>
                    <div className='flex items-center gap-2 min-w-0'>
                      <p className='text-[14px] max-w-[50px] text-text-main-900 truncate w-full'>
                        {user?.full_name?.split(' ')[0]}
                      </p>

                      <Badge.Root
                        size='small'
                        className='whitespace-nowrap'
                        variant='filled'
                        color='green'
                      >
                        {getRole(userSideBarPerm)}
                      </Badge.Root>
                    </div>

                    <p className='w-full text-ellipsis overflow-hidden whitespace-nowrap text-[12px] text-text-sub-500'>
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                )}
              </div>

              {isDrawerOpen && (
                <div className='text-text-sub-500 shrink-0 m-0.5'>
                  <RiArrowRightSLine size={20} />
                </div>
              )}
            </div>
          </Dropdown.Trigger>
          <Dropdown.Content side={isDrawerOpen ? 'top' : 'top'} align='start'>
            <Dropdown.Item onClick={handleLogout}>
              <Dropdown.ItemIcon as={RiLogoutBoxLine} />
              Logout
            </Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Root>
      </div>
    </div>
  );
};

const Sidebar = ({ initialOpen = true }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(initialOpen);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { logout: authLogout } = useAuth();

  const { profileData } = useSelector((state) => state.profile);
  const { userSideBarPerm } = useSelector((state) => state.auth);

  // Helper function to check if a path is active (handles nested routes)
  const isPathActive = useCallback(
    (path) => {
      const currentPath = location.pathname;
      // Exact match
      if (currentPath === path) {
        return true;
      }
      // Check if current path starts with the item path followed by '/'
      // This handles nested routes like /clients/:id
      if (currentPath.startsWith(`${path}/`)) {
        return true;
      }
      return false;
    },
    [location.pathname],
  );
  // Get sidebar data from Redux state
  const storedInStorage = useMemo(() => {
    if (!userSideBarPerm?.data?.message?.sidebar) {
      return [];
    }
    const sidebarData = userSideBarPerm.data.message.sidebar;
    // Filter out 'Settings' from the sidebar
    return Array.isArray(sidebarData) ? sidebarData.filter((item) => item !== 'Settings') : [];
  }, [userSideBarPerm]);

  const sidebarItems = useMemo(() => {
    // storedInStorage is now directly the array
    if (!storedInStorage || !Array.isArray(storedInStorage)) {
      return [];
    }
    return storedInStorage
      .map((item) => {
        const sidebarConfig = sidebar[item];

        if (!sidebarConfig) {
          return null;
        }

        return {
          path: sidebarConfig.path,
          icon: sidebarConfig.icon,
          label: sidebarConfig.label,
          tooltipContent: sidebarConfig.tooltipContent,
          className: 'text-nowrap',
        };
      })
      .filter(Boolean);
  }, [storedInStorage]);

  const handleNavigate = useCallback(
    (path) => {
      navigate(path);
    },
    [navigate],
  );

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((previous) => !previous);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logOutService();
      authLogout();
      dispatch(logoutSuccess());
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      authLogout();
      dispatch(logoutSuccess());
      navigate('/login');
    }
  }, [authLogout, dispatch, navigate]);

  const primaryNotificationCount = useMemo(() => {
    const primary = inboxStaticData.primary ?? [];
    return primary.filter((item) => item.clear !== true).length;
  }, []);

  const bottomNavItems = useMemo(
    () => [
      {
        path: '/inbox',
        icon: <RiInbox2Line size={20} />,
        label: 'Inbox',
        tooltipContent: 'Inbox',
        rightContent:
          primaryNotificationCount > 0 ? (
            <span className='inline-flex min-w-5 items-center justify-center rounded-full bg-primary-base px-1.5 py-0.5 text-label-xs font-medium text-white'>
              {primaryNotificationCount > 99 ? '99+' : primaryNotificationCount}
            </span>
          ) : undefined,
      },
      {
        path: '/settings',
        icon: <RiSettings2Line size={20} />,
        label: 'Settings',
        tooltipContent: 'Settings',
      },
    ],
    [primaryNotificationCount],
  );

  return (
    <div
      className={cn(
        'h-full bg-bg-white-0 border-r border-stroke-soft-200 transition-all duration-200 ease-out flex flex-col',
        isDrawerOpen ? 'w-[280px]' : 'w-[80px]',
      )}
    >
      <Drawer.Header
        showCloseButton={false}
        className={`p-5 justify-between shrink-0 ${isDrawerOpen ? 'flex flex-row' : 'flex flex-col'}`}
      >
        <LogoSection isDrawerOpen={isDrawerOpen} toggleDrawer={toggleDrawer} />
      </Drawer.Header>

      <Drawer.Body className='flex-1 flex flex-col min-h-0 overflow-auto p-5'>
        {/* Toggle button and MAIN label - fixed at top */}
        <div className='flex-shrink-0'>
          {!isDrawerOpen && (
            <div className='w-full flex items-start justify-center'>
              <CompactButton.Icon
                variant='ghost'
                size='large'
                onClick={toggleDrawer}
                className={cn(
                  'border border-stroke-soft-200 text-text-sub-500 rounded-[4px] cursor-pointer ',
                )}
                as={RiArrowRightSLine}
              />
            </div>
          )}
          {/* {isDrawerOpen && <p className='text-[12px] text-text-soft-400'>MAIN</p>} */}
        </div>

        {/* Scrollable Main Navigation - takes available space */}
        <div className='flex-1 w-full overflow-auto min-h-0'>
          <Tooltip.Provider delayDuration={300}>
            <div className='w-full flex flex-col items-center justify-center gap-2 py-2'>
              <NavItemWithTooltip
                isDrawerOpen={isDrawerOpen}
                isActive={isPathActive('/dashboard')}
                onClick={() => handleNavigate('/dashboard')}
                leftIcon={<RiLayoutGridLine size={20} />}
                isOpen={isDrawerOpen}
                tooltipContent='Dashboard'
                className='text-nowrap'
              >
                Dashboard
              </NavItemWithTooltip>

              {sidebarItems.map((item) => (
                <NavItemWithTooltip
                  key={item.path}
                  isDrawerOpen={isDrawerOpen}
                  isActive={isPathActive(item.path)}
                  onClick={() => handleNavigate(item.path)}
                  leftIcon={item.icon}
                  isOpen={isDrawerOpen}
                  tooltipContent={item.tooltipContent}
                  className={item.className}
                >
                  {item.label}
                </NavItemWithTooltip>
              ))}
            </div>
          </Tooltip.Provider>
        </div>

        {/* Settings and Support - fixed at bottom */}
        <div className='shrink-0'>
          <Tooltip.Provider delayDuration={300}>
            <div className='w-full flex flex-col items-center justify-center gap-2 pt-3'>
              {bottomNavItems.map((item) => (
                <NavItemWithTooltip
                  key={item.path}
                  isDrawerOpen={isDrawerOpen}
                  onClick={() => handleNavigate(item.path)}
                  isActive={isPathActive(item.path)}
                  leftIcon={item.icon}
                  rightContent={item.rightContent}
                  isOpen={isDrawerOpen}
                  tooltipContent={item.tooltipContent}
                >
                  {item.label}
                </NavItemWithTooltip>
              ))}
            </div>
          </Tooltip.Provider>
        </div>
      </Drawer.Body>

      <Drawer.Footer className='flex-col shrink-0 px-5 pb-5'>
        <Seperator />
        <UserProfileSection
          userSideBarPerm={userSideBarPerm}
          isDrawerOpen={isDrawerOpen}
          user={profileData}
          handleLogout={handleLogout}
        />
      </Drawer.Footer>
    </div>
  );
};

export default Sidebar;
