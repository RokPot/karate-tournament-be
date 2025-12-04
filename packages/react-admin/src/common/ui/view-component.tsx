import { ReactElement } from 'react';
import {
  Create,
  EditGuesser,
  ListGuesser,
  ShowGuesser,
  SimpleForm,
  TextInput,
  NumberInput,
  DateInput,
  Edit,
  TextField,
  Show,
  BooleanInput,
  DateTimeInput,
  BooleanField,
  DateField,
  SelectField,
  SelectInput,
  UrlField,
  ImageField,
  ImageInput,
  FileInput,
  FileField,
  EmailField,
  ChipField,
  CheckboxGroupInput,
  PasswordInput,
  RadioButtonGroupInput,
  SelectArrayInput,
  TimeInput,
  DeleteButton,
  SimpleShowLayout,
  Datagrid,
  List,
  EditButton,
  ShowButton,
} from 'react-admin';

import { LiveShowCreate } from '~common/ui/pages/live-show/live-show-create.tsx';
import { LiveShowEdit } from '~common/ui/pages/live-show/live-show-edit.tsx';
import { LiveShowShow } from '~common/ui/pages/live-show/live-show-show.tsx';

import { CustomFormDialog } from './custom-form/custom-form-dialog';
import DialogButton from './dialog-button';
import { BlsIdentifierList } from './pages/bls-identifier/bls-identifier-list';
import { BlsWageDataList } from './pages/bls-wage-data/bls-wage-data-list';
import { BlsWageDataByAreaList } from './pages/bls-wage-data-by-area/bls-wage-data-by-area-list';
import { BizOrganizationEdit } from './pages/business/biz-organization/biz-organization-edit';
import { BizOrganizationList } from './pages/business/biz-organization/biz-organization-list';
import { BizOrganizationShow } from './pages/business/biz-organization/biz-organization-show';
import { BizOrganizationUserList } from './pages/business/biz-organization-user/biz-organization-user-list';
import { BizProfileList } from './pages/business/biz-profile/biz-profile-list';
import { BizProfileShow } from './pages/business/biz-profile/biz-profile-show';
import { BizUserList } from './pages/business/biz-user/biz-user-list';
import { BizUserShow } from './pages/business/biz-user/biz-user-show';
import { EndorsementList } from './pages/endorsement/endorsement-list';
import { EndorsementShow } from './pages/endorsement/endorsement-show';
import { IndustryWageGrowthList } from './pages/industry-worth-data/industry-wage-growth-list';
import { LiveShowList } from './pages/live-show/live-show-list';
import { ProfileList } from './pages/profile/profile-list';
import { ProfileShow } from './pages/profile/profile-show';
import { UserEdit } from './pages/user/user-edit';
import { UserList } from './pages/user/user-list';
import { UserShow } from './pages/user/user-show';
import { UserUsageList } from './pages/user-usage/user-usage-list';
import { WatchlistList } from './pages/watchlist/watchlist-list';

interface FieldComponent {
  component: string;
  source?: string;
  key?: string;
}

export interface ViewComponent extends Record<string, any> {
  component: string;
  children?: FieldComponent[];
}

const VIEW_COMPONENT_MAP: Array<{ name: string; component: React.ComponentType<any> }> = [
  { name: 'BizOrganizationEdit', component: BizOrganizationEdit },
  { name: 'BizOrganizationList', component: BizOrganizationList },
  { name: 'BizOrganizationShow', component: BizOrganizationShow },
  { name: 'BizOrganizationUserList', component: BizOrganizationUserList },
  { name: 'BizProfileList', component: BizProfileList },
  { name: 'BizProfileShow', component: BizProfileShow },
  { name: 'BizUserList', component: BizUserList },
  { name: 'BizUserShow', component: BizUserShow },
  { name: 'BlsWageDataByAreaList', component: BlsWageDataByAreaList },
  { name: 'BlsWageDataList', component: BlsWageDataList },
  { name: 'EndorsementList', component: EndorsementList },
  { name: 'EndorsementShow', component: EndorsementShow },
  { name: 'IndustryWageGrowthList', component: IndustryWageGrowthList },
  { name: 'LiveShowCreate', component: LiveShowCreate },
  { name: 'LiveShowEdit', component: LiveShowEdit },
  { name: 'LiveShowList', component: LiveShowList },
  { name: 'LiveShowShow', component: LiveShowShow },
  { name: 'UserEdit', component: UserEdit },
  { name: 'UserList', component: UserList },
  { name: 'UserShow', component: UserShow },
  { name: 'UserUsageList', component: UserUsageList },
  { name: 'WatchlistList', component: WatchlistList },
  { name: 'ProfileList', component: ProfileList },
  { name: 'ProfileShow', component: ProfileShow },
  { name: 'BlsIdentifierList', component: BlsIdentifierList },
];

export function resolveViewComponent(resource: string, name: string, data: ViewComponent): ReactElement | undefined {
  const { component: _component, children, ...props } = data;

  let component: string = _component;

  const viewMapping = VIEW_COMPONENT_MAP.find((v) => v.name === component);

  if (viewMapping) {
    const Component = viewMapping.component;
    return <Component {...props} />;
  }

  if (['list', 'show', 'edit', 'create'].includes(name)) {
    switch (name) {
      case 'list':
        component = children ? 'ListDatagrid' : 'ListGuesser';
        break;
      case 'show':
        component = children ? 'ShowSimpleShowLayout' : 'ShowGuesser';
        break;
      case 'edit':
        component = children ? 'EditSimpleForm' : 'EditGuesser';
        break;
      case 'create':
        if (!children) {
          console.warn(`View ${resource}:${name} component '${component}' requires children`);
          return;
        }
        component = 'CreateSimpleForm';
        break;
    }

    switch (component) {
      case 'ListGuesser':
        return <ListGuesser {...props} />;
      case 'EditGuesser':
        return <EditGuesser {...props} />;
      case 'ShowGuesser':
        return <ShowGuesser {...props} />;
    }
  }

  if (
    ['CreateSimpleForm', 'EditSimpleForm', 'ShowSimpleShowLayout', 'ListDatagrid', 'SimpleForm'].includes(component)
  ) {
    if (!children) {
      console.warn(`View '${name}' component '${component}' requires children`);
      return undefined;
    }

    switch (component) {
      case 'CreateSimpleForm':
        return (
          <Create>
            <SimpleForm {...props}>{children.map((v, i) => resolveInputComponent(resource, name, v, i))}</SimpleForm>
          </Create>
        );
      case 'EditSimpleForm':
        return (
          <Edit>
            <SimpleForm {...props}>{children.map((v, i) => resolveInputComponent(resource, name, v, i))}</SimpleForm>
          </Edit>
        );
      case 'ShowSimpleShowLayout':
        return (
          <Show>
            <SimpleShowLayout {...props}>
              {children.map((v, i) => resolveInputComponent(resource, name, v, i))}
            </SimpleShowLayout>
          </Show>
        );
      case 'ListDatagrid':
        return (
          <List>
            <Datagrid rowClick={false} {...props}>
              {children.map((v, i) => resolveInputComponent(resource, name, v, i))}
              <EditButton />
              <ShowButton />
            </Datagrid>
          </List>
        );
      case 'SimpleForm':
        return (
          <SimpleForm {...props}>{children.map((v, i) => resolveInputComponent(resource, name, v, i))}</SimpleForm>
        );
    }
  }

  switch (component) {
    case 'CustomFormDialog':
      return (
        <CustomFormDialog {...props}>
          {children ? children.map((v, i) => resolveInputComponent(resource, name, v, i)) : []}
        </CustomFormDialog>
      );
  }

  console.warn(`View '${resource}:${name}' component '${component}' not defined`);
  return undefined;
}

export function resolveInputComponent(
  resource: string,
  view: string,
  input: FieldComponent,
  key: number,
): ReactElement | null {
  const { component, key: cKey, ...props } = input;

  switch (component) {
    case 'SelectInput':
      return <SelectInput {...props} key={key} />;
    case 'SelectArrayInput':
      return <SelectArrayInput {...props} key={key} />;

    case 'CheckboxGroupInput':
      return <CheckboxGroupInput {...props} key={key} />;
    case 'RadioButtonGroupInput':
      return <RadioButtonGroupInput {...props} key={key} />;

    case 'DeleteButton':
      return <DeleteButton {...props} key={key} />;

    case 'DialogButton':
      if (!('view' in props) || !props.view || typeof props.view !== 'string') {
        console.warn(`View '${resource}:${view}' component '${component}' needs a view`, props);
        return null;
      }
      return <DialogButton resource={resource} {...props} key={key} view={props.view} />;
  }

  const source = props.source || cKey;
  if (!source) {
    console.warn(`View '${resource}:${view}' component '${component}' needs a source`, props);
    return null;
  }

  switch (component) {
    case 'TextInput':
      return <TextInput {...props} source={source} key={key} />;
    case 'TextareaInput':
      return <TextInput {...props} multiline source={source} key={key} />;
    case 'NumberInput':
      return <NumberInput {...props} source={source} key={key} />;
    case 'DateInput':
      return <DateInput {...props} source={source} key={key} />;
    case 'DateTimeInput':
      return <DateTimeInput {...props} source={source} key={key} />;
    case 'TimeInput':
      return <TimeInput {...props} source={source} key={key} />;
    case 'BooleanInput':
      return <BooleanInput {...props} source={source} key={key} />;
    case 'ImageInput':
      return <ImageInput {...props} source={source} key={key} />;
    case 'FileInput':
      return <FileInput {...props} source={source} key={key} />;
    case 'PasswordInput':
      return <PasswordInput {...props} source={source} key={key} />;

    case 'TextField':
      return <TextField {...props} source={source} key={key} />;
    case 'DateField':
      return <DateField {...props} source={source} key={key} />;
    case 'BooleanField':
      return <BooleanField {...props} source={source} key={key} />;
    case 'SelectField':
      return <SelectField {...props} source={source} key={key} />;
    case 'UrlField':
      return <UrlField {...props} source={source} key={key} />;
    case 'ImageField':
      return <ImageField {...props} source={source} key={key} />;
    case 'FileField':
      return <FileField {...props} source={source} key={key} />;
    case 'EmailField':
      return <EmailField {...props} source={source} key={key} />;
    case 'ChipField':
      return <ChipField {...props} source={source} key={key} />;
  }

  console.warn(`View '${resource}:${view}' component '${component}' not found`, input);
  return null;
}
