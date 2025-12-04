import { Cancel as CancelIcon, Check as CheckIcon } from '@material-ui/icons';
import Button from '@mui/material/Button';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { alpha, styled } from '@mui/material/styles';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useTranslate, SourceContextValue, useResourceContext } from 'ra-core';
import { useCallback, MouseEventHandler, useMemo } from 'react';
import { SourceContextProvider, useDataProvider, useRecordContext } from 'react-admin';
import { FormProvider } from 'react-hook-form';

import { useCustomForm } from '~common/ui/custom-form/custom-form';
import { MaterialIcon } from '~common/ui/material-icon';
import { replaceTemplateValues } from '~common/utils/replace-template-values';

export interface CustomFormDialogProps extends Omit<DialogProps, 'open' | 'onClose' | 'title' | 'content'> {
  isOpen?: boolean;
  onClose?: MouseEventHandler;

  title?: string;
  description?: string;

  cancel?: string;
  cancelIcon?: string;

  confirm?: string;
  confirmColor?: string;
  confirmIcon?: string;

  target?: string;
}

export const CustomFormDialog = (props: CustomFormDialogProps) => {
  const {
    className,
    isOpen = false,
    cancel = 'ra.action.cancel',
    cancelIcon,
    confirm = 'ra.action.confirm',
    confirmColor = 'primary',
    confirmIcon,
    onClose,
    children,
    target,
    ...rest
  } = props;

  const translate = useTranslate();
  const record = useRecordContext();
  const title = replaceTemplateValues(props.title, record);
  const description = replaceTemplateValues(props.description, record);
  const resource = useResourceContext(props);
  const dataProvider = useDataProvider();
  const sourceContext = useMemo<SourceContextValue>(
    () => ({
      getSource: (source: string) => source,
      getLabel: (source: string) => `resources.${resource}.fields.${source}`,
    }),
    [resource],
  );

  const { form, formHandleSubmit, handleSubmit } = useCustomForm({
    ...props,
    onSubmit: () => {
      mutate();
    },
  });

  const { mutate, isPending, data } = useMutation({
    mutationFn: () => dataProvider[target!](resource, { data: form.getValues(), record }),
  });

  if (!target) {
    throw new Error('CustomFormDialog requires target');
  }

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
  }, []);

  // todos
  // - restart dialog
  // - close button on complete
  // - complete status text

  return (
    <StyledDialog
      className={className}
      open={isOpen}
      onClose={onClose}
      onClick={handleClick}
      aria-labelledby="alert-dialog-title"
      {...rest}
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ paddingBottom: '1em' }}>{description}</DialogContentText>
        {data ? (
          <DialogContentText>{JSON.stringify(data)}</DialogContentText>
        ) : (
          <SourceContextProvider value={sourceContext}>
            <FormProvider {...form}>
              <form onSubmit={formHandleSubmit} className={className}>
                {children}
              </form>
            </FormProvider>
          </SourceContextProvider>
        )}
      </DialogContent>
      <DialogActions>
        {(!data && (
          <>
            <Button
              disabled={isPending}
              onClick={onClose}
              startIcon={cancelIcon ? <MaterialIcon icon={cancelIcon} /> : <CancelIcon />}
            >
              {translate(cancel, { _: cancel })}
            </Button>
            <Button
              disabled={isPending}
              onClick={(e) => handleSubmit(undefined, e)}
              className={clsx('ra-confirm', {
                [ConfirmClasses.confirmWarning]: confirmColor === 'warning',
                [ConfirmClasses.confirmPrimary]: confirmColor === 'primary',
              })}
              autoFocus
              startIcon={confirmIcon ? <MaterialIcon icon={confirmIcon} /> : <CheckIcon />}
            >
              {translate(confirm, { _: confirm })}
            </Button>
          </>
        )) || <Button onClick={onClose}>Close</Button>}
      </DialogActions>
    </StyledDialog>
  );
};

const PREFIX = 'RaCustomFormDialog';

const ConfirmClasses = {
  confirmPrimary: `${PREFIX}-confirmPrimary`,
  confirmWarning: `${PREFIX}-confirmWarning`,
};

const StyledDialog = styled(Dialog, {
  name: PREFIX,
  overridesResolver: (_: any, styles) => styles.root,
})(({ theme }) => ({
  [`& .${ConfirmClasses.confirmPrimary}`]: {
    color: theme.palette.primary.main,
  },

  [`& .${ConfirmClasses.confirmWarning}`]: {
    color: theme.palette.error.main,
    '&:hover': {
      backgroundColor: alpha(theme.palette.error.main, 0.12),
      // Reset on mouse devices
      '@media (hover: none)': {
        backgroundColor: 'transparent',
      },
    },
  },
}));
