import * as React from 'react';
import {
  RiAlertFill,
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiInformationFill,
  RiMagicFill,
} from 'react-icons/ri';

import * as Alert from '@/components/ui/alert';
import { toast } from '@/components/ui/toast';

const AlertToast = React.forwardRef((props, forwardedRef) => {
  const { t, status = 'feature', variant = 'stroke', message, dismissable = true, icon } = props;

  let Icon;

  if (icon) {
    Icon = icon;
  } else {
    switch (status) {
      case 'success':
        Icon = RiCheckboxCircleFill;
        break;
      case 'warning':
        Icon = RiAlertFill;
        break;
      case 'error':
        Icon = RiErrorWarningFill;
        break;
      case 'information':
        Icon = RiInformationFill;
        break;
      case 'feature':
        Icon = RiMagicFill;
        break;
      default:
        Icon = RiErrorWarningFill;
        break;
    }
  }

  return (
    <Alert.Root
      ref={forwardedRef}
      status={status}
      variant={variant}
      size='small'
      className='w-[500px]'
    >
      <div className='w-full flex items-center justify-between'>
        <div className='flex items-center justify-start gap-2'>
          <Alert.Icon as={Icon} />
          {message}
        </div>

        <div className='flex items-center justify-end'>
          {dismissable && (
            <button type='button' onClick={() => toast.dismiss(t)}>
              <Alert.CloseIcon />
            </button>
          )}
        </div>
      </div>
    </Alert.Root>
  );
});

AlertToast.displayName = 'AlertToast';

export { AlertToast as Root };
