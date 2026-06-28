import { NAKSHATRA_ICONS } from './data/nakshatraAssets';
import { RASHI_ICONS } from './data/rashiAssets';

export const ALL_ASSETS = [
  // Common UI assets
  require('../assets/images/corner_assest.png'),
  require('../assets/images/OnlyFrame.png'),
  require('../assets/images/rashi circle.png'),
  
  // Videos
  require('../assets/Rotating_Earth.mp4'),
  require('../assets/bg0.mp4'),
  
  // Earth Textures
  require('../assets/earth.jpg'),
  require('../assets/images/earth_normal.jpg'),
  require('../assets/images/earth_specular.jpg'),
  require('../assets/images/earth_clouds.png'),
  require('../assets/images/earth_night.jpg'),
  
  // Digits
  require('../assets/numbers/colon.png'),
  require('../assets/numbers/0.png'),
  require('../assets/numbers/1.png'),
  require('../assets/numbers/2.png'),
  require('../assets/numbers/3.png'),
  require('../assets/numbers/4.png'),
  require('../assets/numbers/5.png'),
  require('../assets/numbers/6.png'),
  require('../assets/numbers/7.png'),
  require('../assets/numbers/8.png'),
  require('../assets/numbers/9.png'),
  
  // Dynamically mapped icons
  ...NAKSHATRA_ICONS,
  ...RASHI_ICONS,
];
