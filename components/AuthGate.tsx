import React, { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';
import { bootstrapCloudData, setCloudUid, ensureLocalUserRecord, clearLocalUserRecord } from '../cloudSync';
import LoginPage from '../LoginPage';
import { App } from '../App';

type GateState = 'checking' | 'signedOut' | 'bootstrapping' | 'ready';

function firebaseErrorToMessage(err: any): string {
  const code = err?.code || '';
  if (code.includes('user-not-found') || code.includes('invalid-credential') || code.includes('wrong-password')) {
    return 'Invalid email or password. Please try again.';
  }
  if (code.includes('email-already-in-use')) {
    return 'An account already exists for this email. Try signing in instead.';
  }
  if (code.includes('weak-password')) {
    return 'Password must be at least 6 characters.';
  }
  if (code.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }
  return err?.message || 'Something went wrong. Please try again.';
}

export const AuthGate: React.FC = () => {
  const [gateState, setGateState] = useState<GateState>('checking');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Firebase not set up yet — fall back to allowing the app to run
      // (local-only mode) rather than locking the founder out entirely.
      setGateState('ready');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        setGateState('bootstrapping');
        setCloudUid(user.uid);
        await bootstrapCloudData(user.uid);
        ensureLocalUserRecord(user.email || 'owner@techinfigo.com', user.uid);
        setGateState('ready');
      } else {
        setCloudUid(null);
        clearLocalUserRecord();
        setGateState('signedOut');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (email: string, password: string): Promise<string | null> => {
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      return null; // success
    } catch (err) {
      return firebaseErrorToMessage(err);
    }
  };

  const handleForgotPassword = async (email: string): Promise<string | null> => {
    if (!isFirebaseConfigured) {
      return 'Password reset requires Firebase to be configured.';
    }
    try {
      await sendPasswordResetEmail(auth, email);
      return null;
    } catch (err) {
      return firebaseErrorToMessage(err);
    }
  };

  if (gateState === 'checking' || gateState === 'bootstrapping') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: '#001d21' }}>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-3 border-[#fcb632]/30 border-t-[#fcb632] rounded-full animate-spin" />
          <p className="text-white/60 text-sm">{gateState === 'bootstrapping' ? 'Loading your data…' : 'Loading…'}</p>
        </div>
      </div>
    );
  }

  if (gateState === 'signedOut') {
    return (
      <LoginPage
        onLogin={handleLogin}
        mode={mode}
        onToggleMode={() => setMode(m => (m === 'signin' ? 'signup' : 'signin'))}
        onForgotPassword={handleForgotPassword}
      />
    );
  }

  return <App onSignOut={() => signOut(auth)} />;
};
