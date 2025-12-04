import { Launch as LaunchIcon } from '@material-ui/icons';
import { ButtonProps } from 'ra-ui-materialui';
import { useContext, useState } from 'react';
import { Button } from 'react-admin';

import { AdminResourcesContext } from '~common/admin/admin.helpers';
import { MaterialIcon } from '~common/ui/material-icon';
import { resolveViewComponent } from '~common/ui/view-component';

interface ActionButtonProps extends ButtonProps {
  // material icon name
  icon?: string;
  view: string;
  resource: string;
}

const DialogButton = (props: ActionButtonProps) => {
  const { resourceViews } = useContext(AdminResourcesContext);
  const [open, setOpen] = useState(false);

  const { resource, view } = props;

  if (!resource || !view) {
    console.error(`DialogButton '${resource}' requires resource and view props`);
    return null;
  }

  if (!resourceViews) {
    console.error(`DialogButton '${resource}' requires AdminResourcesProvider`);
    return null;
  }

  if (!(resource in resourceViews) || !(view in resourceViews[resource]) || !resourceViews[resource][view]) {
    console.error(`DialogButton view '${resource}:${view}' does not exist`);
    return null;
  }

  const handleClick = () => setOpen(true);
  const handleDialogClose = () => setOpen(false);
  const { component, ...viewProps } = resourceViews[resource][view];

  if (!component) {
    console.error(`DialogButton view '${resource}:${view}' component ${component} does not exist`);
    return null;
  }

  return (
    <>
      <Button label={props.label || props.icon || 'Open'} onClick={handleClick}>
        {props.icon ? <MaterialIcon icon={props.icon} /> : <LaunchIcon />}
      </Button>
      {resolveViewComponent(resource, view, {
        ...viewProps,
        component,
        onClose: handleDialogClose,
        isOpen: open,
      })}
    </>
  );
};

export default DialogButton;
