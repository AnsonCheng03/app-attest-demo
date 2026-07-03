import AsyncStorage from '@react-native-async-storage/async-storage';

const iosRegistrationStorageKey = 'integrity-demo-mobile-ios-registration';

type StoredIosRegistration = {
  deviceId?: string;
  keyId: string;
  registeredAt?: string;
};

export async function loadRegisteredIosKeyId() {
  try {
    const raw = await AsyncStorage.getItem(iosRegistrationStorageKey);
    if (!raw) {
      return null;
    }
    const saved = JSON.parse(raw) as Partial<StoredIosRegistration>;
    return typeof saved.keyId === 'string' ? saved.keyId : null;
  } catch (error) {
    console.warn('Failed to load saved iOS registration state', error);
    return null;
  }
}

export async function saveRegisteredIosKey(params: {
  deviceId?: string;
  keyId: string;
}) {
  try {
    await AsyncStorage.setItem(
      iosRegistrationStorageKey,
      JSON.stringify({
        deviceId: params.deviceId,
        keyId: params.keyId,
        registeredAt: new Date().toISOString(),
      } satisfies StoredIosRegistration)
    );
  } catch (error) {
    console.warn('Failed to save iOS registration state', error);
  }
}

export async function clearRegisteredIosKey() {
  try {
    await AsyncStorage.removeItem(iosRegistrationStorageKey);
  } catch (error) {
    console.warn('Failed to clear iOS registration state', error);
  }
}
