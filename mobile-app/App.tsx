import { useEffect } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const TARGET_URL = 'https://policy.alluresofttech.com/';

export default function App() {
  useEffect(() => {
    const openPolicySite = async () => {
      try {
        await Linking.openURL(TARGET_URL);
      } catch (error) {
        console.error('Unable to open policy site', error);
      }
    };

    openPolicySite();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={styles.title}>Opening policy portal</Text>
      <Text style={styles.subtitle}>You will be redirected to {TARGET_URL}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
});
