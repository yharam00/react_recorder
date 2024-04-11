import "./App.css";
import React, { useState, useCallback } from "react";

function App() {
  const [stream, setStream] = useState();
  const [media, setMedia] = useState();
  const [onRec, setOnRec] = useState(true);
  const [source, setSource] = useState();
  const [analyser, setAnalyser] = useState();
  const [audioUrl, setAudioUrl] = useState();
  const [disabled, setDisabled] = useState(true); // 😀😀😀

  const onRecAudio = () => {

    setDisabled(true) // 😀😀😀
    
    // 음원정보를 담은 노드를 생성하거나 음원을 실행또는 디코딩 시키는 일을 한다
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // 자바스크립트를 통해 음원의 진행상태에 직접접근에 사용된다.
    const analyser = audioCtx.createScriptProcessor(0, 1, 1);
    setAnalyser(analyser);

    function makeSound(stream) {
      // 내 컴퓨터의 마이크나 다른 소스를 통해 발생한 오디오 스트림의 정보를 보여준다.
      const source = audioCtx.createMediaStreamSource(stream);
      setSource(source);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
    }
    // 마이크 사용 권한 획득
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mediaRecorder = new MediaRecorder(stream);
      const options = {mimeType: "video/mp4"}; // 이게 사파리에서 동작하기 위한 핵심! by 하람
      mediaRecorder.start();
      setStream(stream);
      setMedia(mediaRecorder);
      makeSound(stream);

      analyser.onaudioprocess = function (e) {
        // 3분(180초) 지나면 자동으로 음성 저장 및 녹음 중지
        if (e.playbackTime > 180) {
          stream.getAudioTracks().forEach(function (track) {
            track.stop();
          });
          mediaRecorder.stop();
          // 메서드가 호출 된 노드 연결 해제
          analyser.disconnect();
          audioCtx.createMediaStreamSource(stream).disconnect();

          mediaRecorder.ondataavailable = function (e) {
            setAudioUrl(e.data);
            setOnRec(true);
          };
        } else {
          setOnRec(false);
        }
      };
    });
  };

  // 사용자가 음성 녹음을 중지 했을 때
  const offRecAudio = () => {
    // dataavailable 이벤트로 Blob 데이터에 대한 응답을 받을 수 있음
    media.ondataavailable = function (e) {
      setAudioUrl(e.data);
      setOnRec(true);
    };

    // 모든 트랙에서 stop()을 호출해 오디오 스트림을 정지
    stream.getAudioTracks().forEach(function (track) {
      track.stop();
    });

    // 미디어 캡처 중지
    media.stop();

    // 메서드가 호출 된 노드 연결 해제
    analyser.disconnect();
    source.disconnect();
    
    setDisabled(false);
  };

  const onSubmitAudioFile = useCallback(() => {
    if (audioUrl) {
      const createdUrl = URL.createObjectURL(audioUrl);
      console.log(createdUrl);
      setOutputUrl(createdUrl);
      window.open(createdUrl, '_blank'); // 새 탭에서 URL 열기
    }
    // File 생성자를 사용해 파일로 변환
    const sound = new File([audioUrl], "soundBlob", { lastModified: new Date().getTime(), type: "audio" });
    console.log(sound); // File 정보 출력
  }, [audioUrl]);

  const play = () => { 
    const audio = new Audio(URL.createObjectURL(audioUrl));
    audio.loop = false;
    audio.volume = 1;
    audio.play();
  };


  const [outputUrl, setOutputUrl] = useState('');

  return (
    <>
      <button onClick={onRec ? onRecAudio : offRecAudio}>녹음</button>
      <button onClick={play} disabled={disabled}>재생</button>
      <button onClick={onSubmitAudioFile} disabled={disabled}>결과 확인</button>
      <h3>{outputUrl || '결과 확인 버튼을 누르면 녹음된 오디오의 URL이 표시되고 새 탭에서 열립니다.'}</h3>
    </>
  );
}

export default App;