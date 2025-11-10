import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export const db = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;
export const productsCollection = db.collection("products");
