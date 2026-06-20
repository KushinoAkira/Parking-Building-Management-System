import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type Props = {
  disabled?: boolean;
  onScan: (plate: string) => void | Promise<void>;
  scanPlate: string;
  onScanPlateChange: (value: string) => void;
};

export function PlateCameraScanner({ disabled, onScan, scanPlate, onScanPlateChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => () => stopCamera(), []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setCameraError("Không mở được camera. Dùng nhập thủ công bên dưới.");
      stopCamera();
    }
  }

  async function handleScan() {
    const plate = scanPlate.trim().toUpperCase();
    if (!plate) return;
    setIsScanning(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      await onScan(plate);
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-gray-900 dark:text-white">Camera Quét Biển Số</h2>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-600/10 px-2.5 py-1 rounded-full border border-blue-600/20">
          <span className={`w-1.5 h-1.5 rounded-full bg-blue-600 ${cameraOn ? "animate-pulse" : "opacity-40"}`} />
          {cameraOn ? "Trực tuyến" : "Chưa bật"}
        </span>
      </div>

      <div className="relative aspect-video bg-gray-100 dark:bg-[#0A0A0A] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 mb-3">
        {cameraOn ? (
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
            <Camera className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-xs px-4 text-center">Bật camera và hướng về biển số xe</p>
          </div>
        )}

        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 gap-3"
            >
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-white text-sm font-semibold">Đang nhận diện...</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute inset-5 pointer-events-none z-10">
          <div className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-blue-600 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-blue-600 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-blue-600 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-blue-600 rounded-br-lg" />
        </div>
      </div>

      {cameraError && <p className="text-xs text-amber-600 mb-2">{cameraError}</p>}

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={cameraOn ? stopCamera : startCamera}
          disabled={disabled || isScanning}
          className="flex-1 border border-gray-200 dark:border-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          {cameraOn ? "Tắt camera" : "Bật camera"}
        </button>
      </div>

      <input
        type="text"
        placeholder="Biển số nhận diện (VD: 30A-123.45)"
        value={scanPlate}
        onChange={(e) => onScanPlateChange(e.target.value.toUpperCase())}
        className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm uppercase mb-3"
      />

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        type="button"
        onClick={handleScan}
        disabled={disabled || isScanning || !scanPlate.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-md shadow-blue-500/20"
      >
        <Camera className="w-5 h-5" />
        {isScanning ? "Đang quét..." : "Quét & xử lý biển số"}
      </motion.button>
    </div>
  );
}
