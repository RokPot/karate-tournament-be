import { type SocketEvent } from './socket.event';

export const USER_PROFILE_UPDATE_EVENT_TYPE = 'user-profile-data-updated';

export class UserProfileUpdateEvent implements SocketEvent {
  type = USER_PROFILE_UPDATE_EVENT_TYPE;
  payload: {
    userId: string;
    success: boolean;
    errors: any[];
    message: string;
    profileData: any;
  };

  constructor(userId: string, profileData: any, success: boolean = true, message: string = '', errors: any[] = []) {
    this.payload = { userId, profileData, success, errors, message };
  }
}

export class UserProfileUpdateSuccessEvent extends UserProfileUpdateEvent {
  constructor(userId: string, profileData: any) {
    super(userId, profileData);
  }
}

export class UserProfileUpdateErrorEvent extends UserProfileUpdateEvent {
  constructor(userId: string, message: string, errors: any[] = []) {
    super(userId, null, false, message, errors);
  }
}
