<template>
  <div class="container">
    <div class="video-box">
      <video id="localVideo" autoplay muted></video>
      <video id="remoteVideo" autoplay></video>
    </div>
    <button v-if="!callStarted" @click="startCall">Start Call</button>
  </div>
</template>

<script>
import io from 'socket.io-client';

export default {
  data() {
    return {
      localStream: null,
      peerConnection: null,
      socket: null,
      callStarted: false,
    };
  },
  mounted() {
    this.initializeSocket();
    this.startVideo();
  },
  methods: {
    initializeSocket() {
      this.socket = io('https://192.168.0.51:3000');
      this.socket.on('offer', (offer) => {
        this.handleOffer(offer);
      });

      this.socket.on('answer', (answer) => {
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      });

      this.socket.on('candidate', (candidate) => {
        this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      });
    },
    async startVideo() {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      document.getElementById('localVideo').srcObject = this.localStream;

      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      };
      this.peerConnection = new RTCPeerConnection(configuration);

      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      this.peerConnection.ontrack = event => {
        document.getElementById('remoteVideo').srcObject = event.streams[0];
      };

      this.peerConnection.onicecandidate = event => {
        if (event.candidate) {
          this.socket.emit('candidate', event.candidate);
        }
      };
    },
    async startCall() {
      this.callStarted = true;
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(new RTCSessionDescription(offer));
      this.socket.emit('offer', offer);
    },
    async handleOffer(offer) {
      this.callStarted = true;
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(new RTCSessionDescription(answer));
      this.socket.emit('answer', answer);
    },
  },
};
</script>

<style>
.container {
  width: 800px;
  height: 300px;
  margin: 0 auto;
  text-align: center;
}

.video-box {
  width: 100%;
  height: 100%;
  display: flex;
  position: relative;
}

.video-box video {
  max-width: 49%;
  padding: 1%;
  max-height: 100%;
  border: 1px solid black;
}
</style>