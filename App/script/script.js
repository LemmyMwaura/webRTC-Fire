import { servers } from './servers'
import { db } from './firebase'
import {
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore'

let pc = new RTCPeerConnection(servers)
let localStream = null
let remoteStream = null

// Dom Elements
const callBtn = document.getElementById('callBtn')
const callInput = document.getElementById('callInput')
const answerBtn = document.getElementById('answerBtn')
const hangupBtn = document.getElementById('hangupBtn')
const webcamBtn = document.getElementById('webcamBtn')
const webcamVideo = document.getElementById('webcamVideo')
const remoteVideo = document.getElementById('remoteVideo')

//1. Setup PeerConnection
webcamBtn.onclick = async () => {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })
  } catch (err) {
    console.log(err.message)
  }
  remoteStream = new MediaStream()

  // push tracks from localeStream to peer connection
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream)
  })

  // pull tracks from remote stream, add to video stream
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track)
    })
  }

  webcamVideo.srcObject = localStream
  remoteVideo.srcObject = remoteStream
}

// 2.Create an Offer
callBtn.onclick = async () => {
  const callDocRef = doc(collection(db, 'calls'))
  const offerCandidatesRef = collection(callDocRef, 'offerCandidates')
  const answerCandidatesRef = collection(callDocRef, 'answerCandidates')

  callInput.value = callDocRef.id

  // get candidate for caller, set to Dp
  pc.onicecandidate = (event) => {
    event.candidate && addDoc(offerCandidatesRef, event.candidate.toJSON())
  }

  // create the offer
  const offerDesc = await pc.createOffer()
  await pc.setLocalDescription(offerDesc)

  const offer = {
    sdp: offerDesc.sdp,
    type: offerDesc.type,
  }

  await setDoc(callDocRef, { offer })

  // listen to remote answ
  onSnapshot(callDocRef, (snapshot) => {
    const data = snapshot.data()

    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDesc = new RTCSessionDescription(data.answer)
      pc.setRemoteDescription(answerDesc)
    }
  })

  // listen to candidates
  onSnapshot(answerCandidatesRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data())
        pc.addIceCandidate(candidate)
      }
    })
  })
}

// Asnwer the call
answerBtn.onclick = async () => {
  const callId = callInput.value
  const callDocRef = doc(db, 'calls', callId)
  const answerCandidatesRef = collection(callDocRef, 'answerCandidates')

  pc.onicecandidate = (event) => {
    event.candidate && addDoc(answerCandidatesRef, event.candidate.toJSON())
  }

  const callData = (await getDoc(callDocRef)).data()
  const offerDesc = callData.offer
  await pc.setRemoteDescription(new RTCSessionDescription(offerDesc))

  const answDesc = await pc.createAnswer()
  await pc.setLocalDescription(answDesc)

  const answer = {
    type: answDesc.type,
    sdp: answDesc.sdp,
  }

  await updateDoc(callDocRef, { answer })

  onSnapshot(offerDesc, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        let data = change.doc.data()
        pc.addIceCandidate(new RTCIceCandidate(data))
      }
    })
  })
}

// hangup
// hangup.onClick = () => {
//   localStream.getTracks().forEach((track) => {
//     pc.close()
//     track.stop()
//   })
// }
