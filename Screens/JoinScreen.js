import React, { useEffect, useState, useRef } from "react";
import {
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import TextInputContainer from "./TextInputContainer";
import { io } from "socket.io-client";
import {
  mediaDevices,
  RTCPeerConnection,
  RTCView,
  RTCIceCandidate,
  RTCSessionDescription,
} from "react-native-webrtc";

export default function App({ navigation }) {
  const [uid, setUid] = useState(Math.random().toFixed(6).replace("0.", ""));
  const [otherUid, setOtherUid] = useState(null);
  const [roomId, setRoomId] = useState(1);
  const socket = io.connect("http://192.168.159.86:5000");

  useEffect(() => {
    const handleRoomJoined = (data) => {
      console.log(data.uid);
      navigation.navigate("Room", { uid, roomId });
    };
    socket.on("joined-room", handleRoomJoined);
    return () => {
      socket.off("joined-room", handleRoomJoined);
    };
  }, [socket]);

  const handleRoomJoin = () => {
    socket.emit("join-room", { uid, roomId });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{
        flex: 1,
        backgroundColor: "#050A0E",
        justifyContent: "center",
        paddingHorizontal: 42,
      }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <>
          <View
            style={{
              padding: 35,
              backgroundColor: "#1A1C22",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 14,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                color: "#D0D4DD",
              }}
            >
              Your Caller ID
            </Text>
            <View
              style={{
                flexDirection: "row",
                marginTop: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 32,
                  color: "#ffff",
                  letterSpacing: 6,
                }}
              >
                {uid}
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: "#1A1C22",
              padding: 40,
              marginTop: 25,
              justifyContent: "center",
              borderRadius: 14,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                color: "#D0D4DD",
              }}
            >
              Enter call id of another user
            </Text>
            <TextInputContainer
              placeholder={"Enter Caller ID"}
              value={otherUid}
              setValue={(text) => {
                setOtherUid(text);
              }}
              keyboardType={"number-pad"}
            />
            <TouchableOpacity
              onPress={handleRoomJoin}
              style={{
                height: 50,
                backgroundColor: "#5568FE",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 12,
                marginTop: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: "#FFFFFF",
                }}
              >
                Call Now
              </Text>
            </TouchableOpacity>
          </View>
        </>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
