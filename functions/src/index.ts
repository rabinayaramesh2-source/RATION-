import {onCall, HttpsError} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2";
import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore, FieldValue} from "firebase-admin/firestore";

initializeApp();
setGlobalOptions({region:"asia-south1", maxInstances:5});

const db=getFirestore();
const auth=getAuth();

/**
 * Demo-friendly customer login.
 * For a production public portal, add a PIN/OTP/second factor.
 */
export const customerLogin=onCall(async request=>{
  const cardId=String(request.data?.cardId||"").trim();
  if(!cardId) throw new HttpsError("invalid-argument","Card ID is required");

  const snap=await db.collection("beneficiaries").where("cardId","==",cardId).limit(1).get();
  if(snap.empty) throw new HttpsError("not-found","Card not registered");

  const b=snap.docs[0];
  const beneficiaryId=b.id;
  const uid=`beneficiary_${beneficiaryId}`;
  try {
    await auth.getUser(uid);
  } catch {
    await auth.createUser({uid,displayName:b.data().name||beneficiaryId});
  }
  await auth.setCustomUserClaims(uid,{role:"customer",beneficiaryId});
  return {token:await auth.createCustomToken(uid), beneficiaryId, name:b.data().name||""};
});

export const recordTransaction=onCall(async request=>{
  if(!request.auth) throw new HttpsError("unauthenticated","Login required");
  const data=request.data||{};
  const commodity=String(data.commodity||"");
  const actualKg=Number(data.actualKg);
  const requestedKg=Number(data.requestedKg);
  if(!commodity || !Number.isFinite(actualKg) || !Number.isFinite(requestedKg))
    throw new HttpsError("invalid-argument","Invalid transaction");

  const ref=db.collection("transactions").doc();
  await ref.set({
    beneficiaryId:String(data.beneficiaryId||request.auth.token.beneficiaryId||""),
    userId:request.auth.uid,
    beneficiaryName:String(data.beneficiaryName||""),
    commodity, requestedKg, actualKg,
    status: actualKg+0.0005>=requestedKg ? "success" : "partial",
    machineId:String(data.machineId||"SRD-001"),
    createdAt:FieldValue.serverTimestamp()
  });
  return {id:ref.id};
});
