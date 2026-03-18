import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as Dropdown from '@/components/ui/dropdown';
import * as Avatar from '@/components/ui/avatar';
import { RiSearchLine, RiNotificationLine } from 'react-icons/ri';
import inboxStaticData from '@/data/inbox-static-data.json';
import { cn } from '@/utils/cn';
import { useAuth } from '@/contexts/auth-context';

function getInitials(fullName, email) {
  const name = (fullName ?? '').trim();
  if (name.length >= 2) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  const e = (email ?? '').trim();
  if (e.length) return e[0].toUpperCase();
  return '?';
}

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'My Submissions', path: '/submissions' },
  { label: 'Delivered Projects', path: '/delivered' },
  { label: 'Client Guides', path: '/guides' },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const initials = useMemo(
    () => getInitials(user?.full_name, user?.email),
    [user?.full_name, user?.email],
  );

  const notificationCount = useMemo(() => {
    const primary = inboxStaticData.primary ?? [];
    return primary.filter((item) => item.clear !== true).length;
  }, []);

  const isActive = (path) => {
    const current = location.pathname || '';
    if (path === '/') return current === '/';
    return current === path || current.startsWith(path + '/');
  };

  return (
    <header className='w-full border-b border-stroke-soft-200 bg-bg-white-0'>
      <div className='max-w-7xl mx-auto w-full px-6 py-3 flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-full bg-primary-base flex items-center justify-center text-white font-medium'>
            P
          </div>
          <span className='label-large text-text-main-900'>CP Portal</span>
        </div>

        <nav className='hidden md:flex items-center gap-4'>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'paragraph-medium px-3 py-2 rounded-lg transition-colors duration-150',
                isActive(item.path)
                  ? 'bg-bg-weak-100 text-text-main-900'
                  : 'text-text-sub-500 hover:bg-bg-weak-100',
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className='flex items-center gap-3'>
          {/* <button
            aria-label='Search'
            className='p-2 rounded-lg text-text-sub-500 hover:bg-bg-weak-100'
          >
            <RiSearchLine size={18} />
          </button> */}

          {/* <Dropdown.Root>
            <Dropdown.Trigger asChild>
              <button className='relative p-2 rounded-lg text-text-sub-500 hover:bg-bg-weak-100'>
                <RiNotificationLine size={18} />
                {notificationCount > 0 && (
                  <span className='absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-error-base text-white text-[10px] px-1'>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
            </Dropdown.Trigger>

            <Dropdown.Content side='bottom' align='end'>
              <Dropdown.Item onClick={() => navigate('/inbox')}>View notifications</Dropdown.Item>
            </Dropdown.Content>
          </Dropdown.Root> */}

          <Dropdown.Root>
            <Dropdown.Trigger asChild>
              <button className='p-1 rounded-full hover:bg-bg-weak-100' aria-label='User menu'>
                <Avatar.Root size={40} color='gray'>
                  {user?.user_image ? (
                    <Avatar.Image
                      src={user.user_image}
                      alt={user.full_name || 'User'}
                    />
                  ) : (
                    <span className='text-label-sm font-medium text-text-main-900'>
                      {initials}
                    </span>
                  )}
                </Avatar.Root>
              </button>
            </Dropdown.Trigger>
            <Dropdown.Content side='bottom' align='end'>
              <Dropdown.Item onClick={() => navigate('/profile')}>Profile</Dropdown.Item>
              <Dropdown.Item onClick={() => navigate('/login')}>Logout</Dropdown.Item>
            </Dropdown.Content>
          </Dropdown.Root>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

