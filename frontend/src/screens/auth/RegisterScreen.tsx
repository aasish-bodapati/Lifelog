import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../../context/UserContext';
import { UserCreate } from '../../types';
import { toastService } from '../../services/toastService';
import { Colors, Layout, Spacing, Typography } from '../../styles/designSystem';

const RegisterScreen: React.FC = () => {
  const [formData, setFormData] = useState<UserCreate>({
    email: '',
    username: '',
    password: '',
    full_name: '',
    goal: 'maintain',
    activity_level: 'moderate',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, state } = useUser();
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (!formData.email || !formData.username || !formData.password) {
      toastService.error('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== confirmPassword) {
      toastService.error('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toastService.error('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      await register(formData);
      toastService.success('Success', 'Account created successfully! You can now sign in.');
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.status === 400) {
        if (error.response.data?.detail?.includes('Email already registered')) {
          errorMessage = 'This email is already registered. Please use a different email.';
        } else if (error.response.data?.detail?.includes('Username already taken')) {
          errorMessage = 'This username is already taken. Please choose a different username.';
        } else {
          errorMessage = error.response.data?.detail || errorMessage;
        }
      } else if (error.response?.status === 422) {
        errorMessage = 'Invalid input. Please check all fields and try again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.code === 'ERR_TIMEOUT') {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      toastService.error('Registration Failed', errorMessage);
    }
  };

  const updateField = (field: keyof UserCreate, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Lifelog today</Text>
        
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email *"
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Username *"
            value={formData.username}
            onChangeText={(value) => updateField('username', value)}
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={formData.full_name}
            onChangeText={(value) => updateField('full_name', value)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password *"
            value={formData.password}
            onChangeText={(value) => updateField('password', value)}
            secureTextEntry
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Confirm Password *"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          
          <TouchableOpacity
            style={[styles.button, state.isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={state.isLoading}
          >
            <Text style={styles.buttonText}>
              {state.isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: 48,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  loginText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  loginLink: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default RegisterScreen;
