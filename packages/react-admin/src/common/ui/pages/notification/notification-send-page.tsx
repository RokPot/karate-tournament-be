import TestIcon from '@mui/icons-material/BugReport';
import SendIcon from '@mui/icons-material/Send';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  Divider,
} from '@mui/material';
import { useContext, useState } from 'react';
import { useNotify } from 'react-admin';

import { AuthnContext } from '~common/authn/authn.helpers';
import { config } from '~common/config';
import { RestClient } from '~common/http';
import { User } from '~common/ui/user-selector/user-selector.types';

import { UserSelector } from '../../user-selector/user-selector';

import {
  NotificationChannelEnum,
  NotificationPriority,
  SendNotificationRequest,
  SendNotificationResponse,
  NotificationFormState,
  ValidNotificationAction,
  RestError,
} from './notification.types';

export const NotificationSendPage = () => {
  const notify = useNotify();
  const { authnToken } = useContext(AuthnContext);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState<{ [key: string]: boolean }>({});

  const [formData, setFormData] = useState<NotificationFormState>({
    userIds: [],
    title: '',
    message: '',
    priority: NotificationPriority.Medium,
    channels: [NotificationChannelEnum.Database],
    action: { text: '', url: '' },
    imageUrl: '',
    emailSubject: '',
    category: 'admin',
  });
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const httpClient = new RestClient(config.apiBaseUrl, () => ({
    Authorization: `Bearer ${authnToken.accessToken}`,
  }));

  const handleInputChange =
    (field: keyof NotificationFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string } }) => {
      const value = event.target.value;
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleActionChange = (field: 'text' | 'url') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      action: {
        ...prev.action,
        [field]: value,
      },
    }));
  };

  const handleChannelChange = (channel: NotificationChannelEnum) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setFormData((prev) => ({
      ...prev,
      channels: checked ? [...(prev.channels || []), channel] : (prev.channels || []).filter((c) => c !== channel),
    }));
  };

  const isFormValid = () => {
    return (
      formData.userIds.length > 0 &&
      formData.title.trim() !== '' &&
      formData.message.trim() !== '' &&
      (formData.channels || []).length > 0
    );
  };

  const handleSendNotification = async () => {
    if (!isFormValid()) {
      notify('Please fill in all required fields', { type: 'error' });
      return;
    }

    setLoading(true);
    try {
      // Clean up empty action fields - ensure both text and url are present or neither
      const cleanAction: ValidNotificationAction | undefined =
        formData.action?.text?.trim() && formData.action?.url?.trim()
          ? {
              text: formData.action.text.trim(),
              url: formData.action.url.trim(),
            }
          : undefined;

      const payload: SendNotificationRequest = {
        ...formData,
        action: cleanAction,
        imageUrl: formData.imageUrl?.trim() || undefined,
        emailSubject: formData.emailSubject?.trim() || undefined,
      };

      const response = await httpClient.post<SendNotificationResponse>('/admin/notifications/send', { body: payload });
      const result = response.data;

      if (result.success) {
        notify('Notification sent successfully', { type: 'success' });

        // Reset form
        setFormData({
          userIds: [],
          title: '',
          message: '',
          priority: NotificationPriority.Medium,
          channels: [NotificationChannelEnum.Database],
          action: { text: '', url: '' },
          imageUrl: '',
          emailSubject: '',
          category: 'admin',
        });
        setSelectedUsers([]);
      } else {
        notify('Send notification was not successful', { type: 'warning' });
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      const errorMessage = (error as RestError)?.response?.data?.message || 'Failed to send notification';
      notify(errorMessage, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async (userId: string) => {
    setTestLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const response = await httpClient.post<SendNotificationResponse>(`/admin/notifications/test/${userId}`, {
        body: {},
      });
      const result = response.data;

      if (result.success) {
        notify('Notification sent successfully', { type: 'success' });
      } else {
        notify('Send notification was not successful', { type: 'warning' });
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      notify('Failed to send test notification', { type: 'error' });
    } finally {
      setTestLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Send Notifications
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Send custom notifications to users via database storage (with real-time websocket updates) and/or email.
      </Alert>

      <Grid container spacing={3}>
        {/* Main Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notification Details
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* User Selection */}
                <UserSelector
                  selectedUserIds={formData.userIds}
                  onSelectionChange={(userIds, users) => {
                    setFormData((prev) => ({ ...prev, userIds }));
                    setSelectedUsers(users);
                  }}
                  disabled={loading}
                />

                {/* Title */}
                <TextField
                  label="Title *"
                  value={formData.title}
                  onChange={handleInputChange('title')}
                  disabled={loading}
                  fullWidth
                  placeholder="e.g., Important Update"
                />

                {/* Message */}
                <TextField
                  label="Message *"
                  value={formData.message}
                  onChange={handleInputChange('message')}
                  disabled={loading}
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Write your notification message here..."
                />

                {/* Priority */}
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={handleInputChange('priority')}
                    disabled={loading}
                    label="Priority"
                  >
                    <MenuItem value={NotificationPriority.Low}>
                      <Chip label="Low" color="default" size="small" sx={{ mr: 1 }} />
                      Low Priority
                    </MenuItem>
                    <MenuItem value={NotificationPriority.Medium}>
                      <Chip label="Medium" color="primary" size="small" sx={{ mr: 1 }} />
                      Medium Priority
                    </MenuItem>
                    <MenuItem value={NotificationPriority.High}>
                      <Chip label="High" color="warning" size="small" sx={{ mr: 1 }} />
                      High Priority
                    </MenuItem>
                    <MenuItem value={NotificationPriority.Critical}>
                      <Chip label="Critical" color="error" size="small" sx={{ mr: 1 }} />
                      Critical Priority
                    </MenuItem>
                  </Select>
                </FormControl>

                {/* Channels */}
                <FormControl component="fieldset">
                  <FormLabel component="legend">Notification Channels *</FormLabel>
                  <FormGroup row>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={(formData.channels || []).includes(NotificationChannelEnum.Database)}
                          onChange={handleChannelChange(NotificationChannelEnum.Database)}
                          disabled={loading}
                        />
                      }
                      label="Database (Real-time)"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={(formData.channels || []).includes(NotificationChannelEnum.Email)}
                          onChange={handleChannelChange(NotificationChannelEnum.Email)}
                          disabled={loading}
                        />
                      }
                      label="Email"
                    />
                  </FormGroup>
                </FormControl>

                <Divider />

                {/* Optional Fields */}
                <Typography variant="h6" gutterBottom>
                  Optional Settings
                </Typography>

                {/* Action Button */}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Action Button Text"
                      value={formData.action?.text || ''}
                      onChange={handleActionChange('text')}
                      disabled={loading}
                      fullWidth
                      placeholder="e.g., View Details"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Action Button URL"
                      value={formData.action?.url || ''}
                      onChange={handleActionChange('url')}
                      disabled={loading}
                      fullWidth
                      placeholder="e.g., https://lossdog.com/updates"
                    />
                  </Grid>
                </Grid>

                {/* Image URL */}
                <TextField
                  label="Image URL"
                  value={formData.imageUrl}
                  onChange={handleInputChange('imageUrl')}
                  disabled={loading}
                  fullWidth
                  placeholder="https://lossdog.com/assets/images/notification.png"
                />

                {/* Email Subject (only shown if email channel is selected) */}
                {(formData.channels || []).includes(NotificationChannelEnum.Email) && (
                  <TextField
                    label="Email Subject"
                    value={formData.emailSubject}
                    onChange={handleInputChange('emailSubject')}
                    disabled={loading}
                    fullWidth
                    placeholder="Will use the title if not specified"
                  />
                )}

                {/* Category */}
                <TextField
                  label="Category"
                  value={formData.category}
                  onChange={handleInputChange('category')}
                  disabled={loading}
                  fullWidth
                  placeholder="e.g., admin, announcement, system"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Actions Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<SendIcon />}
                  onClick={handleSendNotification}
                  disabled={loading || !isFormValid()}
                  fullWidth
                >
                  {loading
                    ? 'Sending...'
                    : `Send to ${formData.userIds.length} User${formData.userIds.length !== 1 ? 's' : ''}`}
                </Button>

                {selectedUsers.length > 0 && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Test Notifications
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Send a test notification to individual users:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {selectedUsers.slice(0, 5).map((user) => {
                        const displayName = user.name || user.email || `ID: ${user.id}`;
                        return (
                          <Button
                            key={user.id}
                            variant="outlined"
                            size="small"
                            startIcon={<TestIcon />}
                            onClick={() => handleTestNotification(user.id)}
                            disabled={testLoading[user.id]}
                            fullWidth
                          >
                            {displayName}
                          </Button>
                        );
                      })}
                      {formData.userIds.length > 5 && (
                        <Typography variant="caption" color="textSecondary" align="center">
                          Showing first 5 users for testing
                        </Typography>
                      )}
                    </Box>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
