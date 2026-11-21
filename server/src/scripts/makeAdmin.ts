import { adminAuth, isFirebaseInitialized } from '../config/firebaseAdmin.js';

async function main() {
  const args = process.argv.slice(2);
  const isRevoke = args.includes('--revoke');
  const email = args.find((arg) => !arg.startsWith('--'));

  console.log('=====================================================');
  console.log('   CivicResolve Municipal Admin Provisioning Tool   ');
  console.log('=====================================================');

  if (!email) {
    console.error('Error: Please provide an email address.');
    console.error('Usage:');
    console.error('  Grant admin:  npm run make-admin -- user@example.com');
    console.error('  Revoke admin: npm run make-admin -- user@example.com --revoke');
    process.exit(1);
  }

  if (!adminAuth || !isFirebaseInitialized) {
    console.error('Error: Firebase Admin is not authenticated.');
    console.error('Please ensure Firebase credentials are configured in server/.env or ADC.');
    process.exit(1);
  }

  try {
    console.log(`[1/3] Searching Firebase Auth for user: ${email}...`);
    const user = await adminAuth.getUserByEmail(email);
    console.log(`[2/3] Found user: ${user.displayName || 'No display name'} (UID: ${user.uid})`);

    const existingClaims = user.customClaims || {};

    if (isRevoke) {
      console.log(`[3/3] Revoking admin claim for ${email}...`);
      const { admin: _, ...remainingClaims } = existingClaims;
      await adminAuth.setCustomUserClaims(user.uid, remainingClaims);
      console.log(`\n SUCCESS: Admin access REVOKED for ${email}.`);
      console.log(`Remaining custom claims:`, remainingClaims);
    } else {
      console.log(`[3/3] Setting custom claim { admin: true } for ${email}...`);
      const updatedClaims = {
        ...existingClaims,
        admin: true,
      };
      await adminAuth.setCustomUserClaims(user.uid, updatedClaims);
      console.log(`\n SUCCESS: Admin custom claim granted for ${email}!`);
      console.log(`Updated custom claims:`, updatedClaims);
      console.log('Note: If the user is currently signed in, they will receive the updated claim upon next token refresh.');
    }
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      console.error(`\n FAILED: No Firebase Auth account found for email: "${email}".`);
      console.error('The user must register an account first before admin privileges can be granted.');
    } else {
      console.error(`\n FAILED: ${(err as Error).message}`);
    }
    process.exit(1);
  }
}

main();
