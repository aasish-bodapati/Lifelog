import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../../context/UserContext';
import { toastService } from '../../services/toastService';
import { Colors, Layout, Spacing, Typography } from '../../styles/designSystem';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, state } = useUser();
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email || !password) {
      toastService.error('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      toastService.success('Welcome back!', 'You have successfully logged in.');
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.status === 401) {
        // Check if we have a specific error message from the backend
        const backendMessage = error.response?.data?.detail;
        if (backendMessage) {
          errorMessage = backendMessage;
        } else {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        }
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid request. Please check your input.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'ERR_TIMEOUT') {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      toastService.error('Login Failed', errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Lifelog</Text>
        <Text style={styles.subtitle}>Track your fitness journey</Text>
        
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TouchableOpacity
            style={[styles.button, state.isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={state.isLoading}
          >
            <Text style={styles.buttonText}>
              {state.isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register' as never)}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  title: {
    ...Typography.h1,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.sm,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: 48,
    color: Colors.textSecondary,
  },
  form: {
    gap: Spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSmall,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.body,
    backgroundColor: Colors.background,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Layout.radiusSmall,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled,
  },
  buttonText: {
    ...Typography.button,
    color: Colors.textLight,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  signupText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  signupLink: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default LoginScreen;
