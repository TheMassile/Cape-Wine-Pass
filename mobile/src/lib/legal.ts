import { Linking } from 'react-native';

export const PRIVACY_URL = 'https://capewinepass.co.za/privacy';
export const DELETE_ACCOUNT_URL = 'https://capewinepass.co.za/delete-account';

export function openPrivacyPolicy() {
  Linking.openURL(PRIVACY_URL).catch(() => {});
}
