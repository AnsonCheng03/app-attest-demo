import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4efe7',
  },
  container: {
    padding: 20,
    gap: 16,
  },
  blockedScreen: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  hero: {
    backgroundColor: '#103c2f',
    borderRadius: 24,
    padding: 20,
  },
  title: {
    color: '#fff8ee',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#d4f3df',
    fontSize: 16,
    marginBottom: 12,
  },
  meta: {
    color: '#d2e3db',
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fffaf3',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5d6c4',
  },
  statusCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  statusReady: {
    backgroundColor: '#edfdf5',
    borderColor: '#86efac',
  },
  statusFallback: {
    backgroundColor: '#fff7ed',
    borderColor: '#fdba74',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#103c2f',
    marginBottom: 6,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
  },
  helperText: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#103c2f',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#c7b8a5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  actions: {
    gap: 10,
  },
  button: {
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  buttonText: {
    color: '#f6fffd',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15,
  },
  requestStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requestStatusText: {
    flex: 1,
    color: '#0f766e',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  logLine: {
    color: '#3f3a35',
    marginTop: 8,
  },
});
