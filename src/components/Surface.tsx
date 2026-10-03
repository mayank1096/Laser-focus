import { createContext, useContext } from 'react';
import { colors } from '../theme';

/**
 * The background colour of the screen a component sits on. Fields fill
 * themselves with it so illustrations never show through their text.
 */
export const SurfaceContext = createContext<string>(colors.white);

export const useSurface = () => useContext(SurfaceContext);
