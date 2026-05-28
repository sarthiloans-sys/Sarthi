/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth";
import { getFirestore, doc, getDocFromServer, collection, addDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Check if Firebase has a valid programmatic integration config loaded
export const isFirebaseReady = !!(firebaseConfig && firebaseConfig.apiKey);

let appInstance: any = null;
let dbInstance: any = null;
let authInstance: any = null;

if (isFirebaseReady) {
  try {
    appInstance = initializeApp(firebaseConfig);
    // CRITICAL: Must use the firestoreDatabaseId from configuration
    dbInstance = getFirestore(appInstance, firebaseConfig.firestoreDatabaseId || "(default)");
    authInstance = getAuth(appInstance);

    // Hardened Validate Connection to dynamic Firestore host
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(dbInstance, "test", "connection"));
      } catch (error: any) {
        if (error instanceof Error && error.message.includes("offline")) {
          console.warn("Firebase client is offline. Verify configuration parameters.");
        }
      }
    };
    testConnection();
  } catch (err) {
    console.error("Firebase services initialization failed:", err);
  }
}

export const db = dbInstance;
export const auth = authInstance;
export const googleProvider = new GoogleAuthProvider();

// Standard handle ERROR JSON structures for security-validation tracking
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Policy Violation Info: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
