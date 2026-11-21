import { useLocationContext } from '../contexts/LocationContext.js';

export const useCurrentLocation = () => {
  return useLocationContext();
};
