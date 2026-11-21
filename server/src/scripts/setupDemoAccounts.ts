import { adminAuth, adminFirestore, isFirebaseInitialized } from '../config/firebaseAdmin.js';
import dotenv from 'dotenv';

dotenv.config();

const DEMO_CITIZEN_EMAIL = process.env.DEMO_CITIZEN_EMAIL || 'citizen@civicresolve.org';
const DEMO_CITIZEN_PASSWORD = process.env.DEMO_CITIZEN_PASSWORD || 'CitizenDemo@2026';
const DEMO_ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL || 'admin@civicresolve.org';
const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || 'AdminDemo@2026';

async function setupDemoAccounts() {
  console.log('=====================================================');
  console.log('   CivicResolve Hackathon Demo Accounts Setup       ');
  console.log('=====================================================');

  if (!adminAuth || !isFirebaseInitialized) {
    console.warn('[Notice] Firebase Admin credentials not detected or emulator active.');
    console.warn('If running against Firebase Emulator, ensure FIREBASE_AUTH_EMULATOR_HOST is set.');
    return;
  }

  try {
    // 1. Setup Demo Citizen Account
    console.log(`\n[1/2] Checking Demo Citizen Account (${DEMO_CITIZEN_EMAIL})...`);
    let citizenUid: string;
    try {
      const existingCitizen = await adminAuth.getUserByEmail(DEMO_CITIZEN_EMAIL);
      citizenUid = existingCitizen.uid;
      console.log(`✓ Existing citizen account found (UID: ${citizenUid}).`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        console.log('Creating new Demo Citizen account...');
        const newCitizen = await adminAuth.createUser({
          email: DEMO_CITIZEN_EMAIL,
          password: DEMO_CITIZEN_PASSWORD,
          displayName: 'Demo Citizen (Ward 114)',
          emailVerified: true,
        });
        citizenUid = newCitizen.uid;
        console.log(`✓ Demo Citizen account created successfully (UID: ${citizenUid}).`);
      } else {
        throw err;
      }
    }

    // Ensure citizen custom claims do NOT contain admin
    await adminAuth.setCustomUserClaims(citizenUid, { admin: false });
    console.log(`✓ Verified role=citizen for UID: ${citizenUid} (admin claim: false).`);

    // 2. Setup Demo Admin Account
    console.log(`\n[2/2] Checking Demo Admin Account (${DEMO_ADMIN_EMAIL})...`);
    let adminUid: string;
    try {
      const existingAdmin = await adminAuth.getUserByEmail(DEMO_ADMIN_EMAIL);
      adminUid = existingAdmin.uid;
      console.log(`✓ Existing admin account found (UID: ${adminUid}).`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        console.log('Creating new Demo Administrator account...');
        const newAdmin = await adminAuth.createUser({
          email: DEMO_ADMIN_EMAIL,
          password: DEMO_ADMIN_PASSWORD,
          displayName: 'Municipal Triage Officer',
          emailVerified: true,
        });
        adminUid = newAdmin.uid;
        console.log(`✓ Demo Admin account created successfully (UID: ${adminUid}).`);
      } else {
        throw err;
      }
    }

    // Authoritatively grant admin custom claim
    await adminAuth.setCustomUserClaims(adminUid, { admin: true });
    console.log(`✓ Granted authoritative custom claim { admin: true } to UID: ${adminUid}.`);

    // 3. Optional Firestore Profile writing
    if (adminFirestore) {
      try {
        await adminFirestore.collection('users').doc(citizenUid).set(
          {
            uid: citizenUid,
            email: DEMO_CITIZEN_EMAIL,
            displayName: 'Demo Citizen (Ward 114)',
            role: 'citizen',
            preferredLanguage: 'en',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        await adminFirestore.collection('users').doc(adminUid).set(
          {
            uid: adminUid,
            email: DEMO_ADMIN_EMAIL,
            displayName: 'Municipal Triage Officer',
            role: 'admin',
            preferredLanguage: 'en',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        console.log('✓ Firestore user profiles synchronized successfully.');
      } catch (err) {
        console.log('Notice: Firestore profile write deferred (emulator or local mode active).');
      }
    }

    console.log('\n=====================================================');
    console.log(' SUCCESS: Both Demo Accounts are Ready for Hackathon!');
    console.log('=====================================================');
    console.log('Citizen: ' + DEMO_CITIZEN_EMAIL);
    console.log('Admin:   ' + DEMO_ADMIN_EMAIL);
    console.log('-----------------------------------------------------');
  } catch (error: any) {
    console.error('\nError configuring demo accounts:', error.message || error);
    process.exit(1);
  }
}

setupDemoAccounts();
