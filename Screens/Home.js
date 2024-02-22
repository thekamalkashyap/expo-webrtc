import { StatusBar } from "expo-status-bar";
import { useRef, useState, useEffect } from "react";
import socket from "../utils/socket";
import { StyleSheet, Text, View } from "react-native";
import { RTCPeerConnection, RTCView, mediaDevices } from "react-native-webrtc";

export default ({ navigation }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const peer = useRef(
    new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
      iceCandidatePoolSize: 10,
    })
  );

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={{ fontSize: 40 }}>Home</Text>
      <View>
        <RTCView streamURL={localStream.toURL()} />
        <RTCView streamURL={remoteStream.toURL()} />
        {isCalling ? (
          <>
            <Button title="Answer Call" onPress={answerCall} />
            <Button title="Reject Call" onPress={rejectCall} />
          </>
        ) : (
          <Button title="Start Call" onPress={startCall} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
