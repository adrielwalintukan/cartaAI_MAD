import { Fraunces_400Regular, Fraunces_400Regular_Italic, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';

const fonts = {
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_600SemiBold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
};

/** true bila font sudah termuat (atau gagal: jatuh ke font sistem, jangan menahan layar). */
export function useAppFonts() {
  const [loaded, error] = useFonts(fonts);
  return loaded || !!error;
}
