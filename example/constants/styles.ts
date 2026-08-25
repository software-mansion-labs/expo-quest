import { StyleSheet } from 'react-native';

import { Colors } from './colors';

export const GlobalStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.swmBlue,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.white,
  },
  contentContainer: {
    padding: 20,
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoBox: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 4,
    marginBottom: 10,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.swmNavy,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.swmNavy,
  },
  itemTitle: {
    marginRight: 8,
    fontWeight: 'bold',
    color: Colors.swmNavy,
  },
  dataText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  statusLabel: {
    fontWeight: 'bold',
    color: Colors.swmNavy,
  },
  statusValue: {
    color: Colors.swmNavy,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    width: '100%',
  },
  buttonPrimary: {
    backgroundColor: Colors.swmNavy,
  },
  buttonDanger: {
    backgroundColor: Colors.swmRed,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  loadingIndicator: {
    marginRight: 8,
  },
});
