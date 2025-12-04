import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import { Menu } from 'react-admin';

export const AdminMenu = () => {
  return (
    <Menu>
      <Menu.DashboardItem to="/" />
      <Menu.ResourceItem name="user" />
      <Menu.ResourceItem name="profile" />
      <Menu.ResourceItem name="user-usage" />
      <Menu.ResourceItem name="endorsement" />
      <Menu.Item to="/persona" primaryText="Persona" leftIcon={<PersonIcon />} />
      <Menu.Item to="/admin-actions" primaryText="Admin Actions" leftIcon={<AdminPanelSettingsIcon />} />
      <Menu.Item to="/notification/send" primaryText="Send Notifications" leftIcon={<AdminPanelSettingsIcon />} />
      <Menu.ResourceItem name="industry-wage-growth" />
      <Menu.ResourceItem name="bls-wage-data" />
      <Menu.ResourceItem name="bls-wage-data-by-area" />
      <Menu.ResourceItem name="biz-organization" />
      <Menu.ResourceItem name="biz-profile" />
      <Menu.ResourceItem name="biz-user" />
      <Menu.ResourceItem name="watchlist" />
      <Menu.ResourceItem name="live-show" />
      <Menu.ResourceItem name="bls-identifier" />
    </Menu>
  );
};
