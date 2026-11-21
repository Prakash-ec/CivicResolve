import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  admin: boolean;
  phone_number?: string;
  phone_verified: boolean;
  claims: DecodedIdToken;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
