import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBAXA1pc_WrUTqSm9QjDLPBSKkLESgwPD8',
  authDomain: 'civicresolve-969d3.firebaseapp.com',
  projectId: 'civicresolve-969d3',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function run() {
  console.log('Testing client auth...');
  // 1. Try sign in admin
  try {
    const cred = await signInWithEmailAndPassword(auth, 'admin@civicresolve.org', 'AdminDemo@2026');
    console.log('Admin already exists! UID:', cred.user.uid);
  } catch (err: any) {
    console.log('Admin sign in failed with:', err.code, err.message);
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      console.log('Attempting to create admin account via client SDK...');
      try {
        const newCred = await createUserWithEmailAndPassword(auth, 'admin@civicresolve.org', 'AdminDemo@2026');
        console.log('Successfully created admin account! UID:', newCred.user.uid);
      } catch (createErr: any) {
        console.error('Failed to create admin:', createErr.code, createErr.message);
      }
    }
  }

  // 2. Try sign in citizen
  try {
    const cred = await signInWithEmailAndPassword(auth, 'citizen@civicresolve.org', 'CitizenDemo@2026');
    console.log('Citizen already exists! UID:', cred.user.uid);
  } catch (err: any) {
    console.log('Citizen sign in failed with:', err.code, err.message);
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      console.log('Attempting to create citizen account via client SDK...');
      try {
        const newCred = await createUserWithEmailAndPassword(auth, 'citizen@civicresolve.org', 'CitizenDemo@2026');
        console.log('Successfully created citizen account! UID:', newCred.user.uid);
      } catch (createErr: any) {
        console.error('Failed to create citizen:', createErr.code, createErr.message);
      }
    }
  }

  process.exit(0);
}

run();
