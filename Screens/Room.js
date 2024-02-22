import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState, useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { io } from "socket.io-client";
import { RTCPeerConnection, mediaDevices, RTCView } from "react-native-webrtc";

export default ({ navigation }) => {
  const peer = useRef(
    new RTCPeerConnection({
      iceServers: [
        {
          urls: ["stun:stun.l.google.com:19302"],
        },
      ],
    })
  );
  const socket = io.connect("http://192.168.209.86:5000");

  const route = useRoute();
  const uid = route.params?.uid;
  const roomId = route.params?.roomId;
  const [myStream, setmyStream] = useState(null);
  const [remoteStream, setremoteStream] = useState(null);
  const [remoteUid, setRemoteUid] = useState();

  const handleNewUserJoined = useCallback(
    async (data) => {
      const { uid } = data;
      const createOffer = async () => {
        const offer = await peer.current.createOffer();
        await peer.current.setLocalDescription(offer);
        return offer;
      };
      console.log("new user joined", uid);
      const offer = await createOffer();
      socket.emit("call-user", { uid, offer });
      setRemoteUid(uid);
    },
    [socket]
  );

  const handleIncommingCall = useCallback(
    async (data) => {
      const { fromUid, offer } = data;
      const createAnswer = async (offer) => {
        await peer.current.setRemoteDescription(offer);
        const answer = await peer.current.createAnswer();
        await peer.current.setLocalDescription(answer);
        return answer;
      };
      console.log("Incomming call from ", fromUid, offer);
      const ans = await createAnswer(offer);
      socket.emit("call-accepted", { uid: fromUid, answer: ans });
      setRemoteUid(fromUid);
    },
    [socket]
  );

  const handleCallAccepted = useCallback(async (data) => {
    const { answer } = data;
    const setRemoteAnswer = async (answer) => {
      await peer.current.setRemoteDescription(answer);
    };
    console.log("call got accepted", answer);
    await setRemoteAnswer(answer);
  }, []);

  const getUserMediaMyStream = useCallback(async () => {
    const myStream = await mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    setmyStream(myStream);
  }, []);

  const handleNegotiationNeededEvent = useCallback(() => {
    const localOffer = peer.current.localDescription;
    socket.emit("call-user", { uid: remoteUid, offer: localOffer });
  }, [peer.current.localDescription, remoteUid, socket]);

  useEffect(() => {
    socket.on("user-joined", handleNewUserJoined);
    socket.on("incomming-call", handleIncommingCall);
    socket.on("call-accepted", handleCallAccepted);
    return () => {
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incomming-call", handleIncommingCall);
      socket.off("call-accepted", handleCallAccepted);
    };
  }, [handleCallAccepted, handleIncommingCall, handleNewUserJoined, socket]);

  useEffect(() => {
    peer.current.addEventListener(
      "negotiationneeded",
      handleNegotiationNeededEvent
    );
    return () => {
      peer.current.removeEventListener(
        "negotiationneeded",
        handleNegotiationNeededEvent
      );
    };
  }, [handleNegotiationNeededEvent, peer.current]);

  useEffect(() => {
    getUserMediaMyStream();
  }, [getUserMediaMyStream]);

  const sendStream = async (myStream) => {
    const tracks = myStream.getTracks();
    tracks.forEach((track) => {
      const existingSender = peer.current
        .getSenders()
        .find((sender) => sender.track === track);
      if (existingSender) {
        peer.current.removeTrack(existingSender);
      }
    });
    tracks.forEach((track) => {
      peer.current.addTrack(track, myStream);
    });
  };

  useEffect(() => {
    const handleTrackEvent = (ev) => {
      const [remoteStream] = ev.remoteStreams;
      setremoteStream(remoteStream[0]);
    };
    peer.current.addEventListener("track", handleTrackEvent);
    return () => {
      peer.current.removeEventListener("track", handleTrackEvent);
    };
  }, [peer.current]);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text>you are connected to {remoteUid}</Text>
      <View style={{ height: 200, width: 200, backgroundColor: "black" }}>
        {myStream && (
          <RTCView
            mirror={true}
            objectFit={"cover"}
            streamURL={myStream.toURL()}
          />
        )}
      </View>
      <View style={{ height: 200, width: 200 }}>
        {remoteStream && (
          <RTCView
            mirror={true}
            objectFit={"cover"}
            streamURL={remoteStream.toURL()}
          />
        )}
      </View>
      <View>
        <Text
          style={{ fontSize: 25 }}
          onPress={() => {
            sendStream(myStream);
          }}
        >
          connect
        </Text>
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
