export enum NotificationChannelEnum {
  Database = 'database',
  Email = 'email',
}

export enum NotificationPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export interface NotificationAction {
  text?: string;
  url?: string;
}

export interface ValidNotificationAction {
  text: string;
  url: string;
}

export interface SendNotificationRequest {
  userIds: string[];
  title: string;
  message: string;
  priority?: NotificationPriority;
  channels?: NotificationChannelEnum[];
  action?: ValidNotificationAction;
  imageUrl?: string;
  emailSubject?: string;
  category?: string;
}

export interface NotificationFormState {
  userIds: string[];
  title: string;
  message: string;
  priority?: NotificationPriority;
  channels?: NotificationChannelEnum[];
  action?: NotificationAction;
  imageUrl?: string;
  emailSubject?: string;
  category?: string;
}

export interface ApiErrorResponse {
  message: string;
  statusCode?: number;
  error?: string;
}

export interface SendNotificationResponse {
  success: boolean;
  sentCount: number;
  failedCount: number;
}

export interface RestError extends Error {
  response?: {
    data?: ApiErrorResponse;
    status?: number;
  };
}
