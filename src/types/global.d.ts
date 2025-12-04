import { type INotificationData } from '~common/notification';

import { type ExternalMetadata as LiveShowExternalMetadata } from '~modules/live-show/live-show.types';
import { type ProfileV2Data } from '~modules/profile-extraction/v2/types/profile-extraction-v2.types';

declare global {
  namespace PrismaJson {
    type LiveShowExternalMetadataJson = LiveShowExternalMetadata;
    type ProfileV2DataJson = ProfileV2Data;
    type NotificationDataJson = INotificationData;
  }
}
