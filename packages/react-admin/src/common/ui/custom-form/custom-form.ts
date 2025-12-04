import { ValidateForm, getSimpleValidationResolver, useNotifyIsFormInvalid } from 'ra-core';
import { BaseSyntheticEvent, useCallback } from 'react';
import { FieldValues, SubmitHandler, useForm, UseFormProps } from 'react-hook-form';

export type UseCustomFormProps = {
  defaultValues?: any;
  onSubmit?: SubmitHandler<FieldValues>;
} & Omit<UseFormProps, 'onSubmit'> & {
    validate?: ValidateForm;
  };

export const useCustomForm = (props: UseCustomFormProps) => {
  const {
    criteriaMode = 'firstError',
    defaultValues,
    resolver,
    reValidateMode = 'onChange',
    onSubmit,
    validate,
    ...rest
  } = props;

  const finalResolver = resolver ? resolver : validate ? getSimpleValidationResolver(validate) : undefined;

  const form = useForm({
    criteriaMode,
    values: defaultValues,
    reValidateMode,
    resolver: finalResolver,
    ...rest,
  });

  // notify on invalid form
  useNotifyIsFormInvalid(form.control, true);

  // submit callbacks
  const handleSubmit = useCallback(
    async (values: any, event: any) => {
      let errors;
      if (onSubmit) {
        errors = await onSubmit(values, event);
      }
      if (errors != null) {
        console.error(errors);
        // todo, class-validator errors
        // setSubmissionErrors(errors, formRef.current.setError);
        //  setError(`${rootPath}${name}`, {
        //                 type: 'server',
        //                 message: error.toString(),
        //             });
      }
    },
    [onSubmit],
  );

  const formHandleSubmit = useCallback(
    (event: BaseSyntheticEvent) => {
      if (!event.defaultPrevented) {
        // Prevent outer forms to receive the event
        event.stopPropagation();
        form.handleSubmit(handleSubmit)(event);
      }
      return;
    },
    [form, handleSubmit],
  );

  return {
    form,
    handleSubmit,
    formHandleSubmit,
  };
};
