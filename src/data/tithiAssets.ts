import { ImageSourcePropType } from 'react-native';

// TODO: Replace with actual Tithi assets when provided by user.
// Using the moon image as a temporary placeholder for all 30 tithis.
export const TITHI_ICONS: ImageSourcePropType[] = new Array(30).fill(
  require('../../assets/images/moon1.png')
);
