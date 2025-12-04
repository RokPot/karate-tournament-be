import * as icons from '@material-ui/icons';
import { SvgIconComponent } from '@material-ui/icons';

export function MaterialIcon(props: { icon: string }) {
  if (!props.icon) {
    return null;
  }

  const IconComponent =
    props.icon && typeof props.icon === 'string' && props.icon in icons
      ? (icons as Record<string, SvgIconComponent>)[props.icon]
      : icons.Launch;

  return <IconComponent />;
}
