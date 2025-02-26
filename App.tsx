import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Mic, WaveformIcon } from 'lucide-react';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0);
  const [frequency, setFrequency] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 2048;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      setIsRecording(true);
      analyze();
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setVolume(0);
    setFrequency(0);
  };

  const analyze = () => {
    if (!analyserRef.current || !isRecording) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateMetrics = () => {
      if (!isRecording) return;

      // Get volume
      analyser.getByteTimeDomainData(dataArray);
      let sumSquares = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const amplitude = (dataArray[i] - 128) / 128;
        sumSquares += amplitude * amplitude;
      }
      const volume = Math.sqrt(sumSquares / dataArray.length) * 100;
      setVolume(Math.round(volume));

      // Get dominant frequency
      analyser.getByteFrequencyData(dataArray);
      let maxValue = 0;
      let maxIndex = 0;
      for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] > maxValue) {
          maxValue = dataArray[i];
          maxIndex = i;
        }
      }
      const frequency = (maxIndex * audioContextRef.current!.sampleRate) / analyser.fftSize;
      setFrequency(Math.round(frequency));

      requestAnimationFrame(updateMetrics);
    };

    updateMetrics();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Audio Analyzer</h1>
        
        <div className="flex justify-center mb-8">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-medium transition-colors ${
              isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isRecording ? (
              <>
                <Mic className="w-5 h-5" /> Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" /> Start Recording
              </>
            )}
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Volume2 className="w-6 h-6 text-blue-500" />
            <div>
              <div className="text-sm font-medium text-gray-500">Volume</div>
              <div className="text-lg font-semibold">{volume}%</div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <WaveformIcon className="w-6 h-6 text-blue-500" />
            <div>
              <div className="text-sm font-medium text-gray-500">Frequency</div>
              <div className="text-lg font-semibold">{frequency} Hz</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

export default App