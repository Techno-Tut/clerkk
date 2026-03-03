import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import {useRouter} from 'expo-router';

export default function BackButton() {
  const router = useRouter();

  return (
    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
      <Text style={styles.backText}>← Back</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
});
