import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { createWorker } from "tesseract.js";

type Props = {
  disabled?: boolean;
  onScan: (plate: string) => void | Promise<void>;
  scanPlate: string;
  onScanPlateChange: (value: string) => void;
};

export function PlateCameraScanner({ disabled, onScan, scanPlate, onScanPlateChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<any>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanHint, setScanHint] = useState("");

  useEffect(() => {
    // Khởi tạo Tesseract worker sớm để tránh delay lúc quét
    initWorker();
    return () => {
      stopCamera();
      terminateWorker();
    };
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function terminateWorker() {
    if (workerRef.current) {
      await workerRef.current.terminate();
      workerRef.current = null;
    }
  }

  async function initWorker() {
    if (!workerRef.current) {
      const worker = await createWorker();
      await worker.load();
      await worker.loadLanguage("eng");
      await worker.initialize("eng");
      workerRef.current = worker;
    }
    return workerRef.current;
  }

  async function getCameraStream() {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      console.warn("⚠️ Không mở được camera với facingMode=environment, fallback sang camera mặc định:", msg);
      return navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    }
  }

  async function startCamera() {
    setCameraError("");
    setScanHint("");
    stopCamera();

    try {
      const stream = await getCameraStream();
      streamRef.current = stream;

      if (!videoRef.current) {
        throw new Error("Video element chưa sẵn sàng.");
      }

      const video = videoRef.current;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.srcObject = stream;

      const handlePlay = () => {
        console.log("✅ Camera stream playing");
        setCameraError("");
        setCameraOn(true);
      };

      const handleError = () => {
        console.error("❌ Video playback error");
        setCameraError("Video không thể phát. Kiểm tra lại quyền camera hoặc thử trình duyệt khác.");
        stopCamera();
      };

      video.onloadedmetadata = () => {
        console.log("📹 Metadata loaded, video size:", video.videoWidth, "x", video.videoHeight);
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          video.play().catch((err) => {
            console.warn("⚠️ Play after metadata failed:", err);
          });
        }
      };

      video.onplay = handlePlay;
      video.onerror = handleError;

      try {
        await video.play();
      } catch (err) {
        console.warn("⚠️ Immediate autoplay blocked:", (err as Error).message || err);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Không xác định";
      if (msg.includes("Permission denied") || msg.includes("NotAllowedError")) {
        setCameraError("Bạn chưa cấp quyền camera. Kiểm tra settings trình duyệt.");
      } else if (msg.includes("NotFoundError")) {
        setCameraError("Không có camera nào được tìm thấy.");
      } else {
        setCameraError("Không mở được camera. Dùng nhập thủ công bên dưới.");
      }
      stopCamera();
    }
  }

  function normalizePlateText(text: string) {
    return text
      .toUpperCase()
      .replace(/O/g, "0")
      .replace(/I/g, "1")
      .replace(/[^A-Z0-9.-]/g, "");
  }

  function extractPlateFromText(text: string) {
    const cleaned = normalizePlateText(text.replace(/\s+/g, ""));
    const patterns = [
      /[0-9]{1,2}[A-Z]{1,3}-[0-9]{2,4}(?:\.[0-9]{2})?/, // 30A-123.45 / 51G-1234
      /[0-9]{1,2}[A-Z]{1,3}[0-9]{2,4}(?:\.[0-9]{2})?/, // 30A12345
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match?.[0]) {
        let plate = match[0];
        if (!plate.includes("-")) {
          plate = plate.replace(/^([0-9]{1,2}[A-Z]{1,3})([0-9].*)$/, "$1-$2");
        }
        return plate;
      }
    }

    return null;
  }

  async function captureFrame() {
    if (!videoRef.current) throw new Error("Camera chưa sẵn sàng.");
    
    const video = videoRef.current;
    
    // ⚠️ Kiểm tra xem video có frame không (tránh blank frame)
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn("Video metadata not ready:", video.videoWidth, "x", video.videoHeight);
      throw new Error("Video chưa load frame. Hãy đợi 1-2 giây và thử lại.");
    }
    
    if (video.paused || video.ended) {
      throw new Error("Video không phát. Hãy bật camera trước.");
    }
    
    const width = video.videoWidth;
    const height = video.videoHeight;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Không tạo được canvas.");
    ctx.drawImage(video, 0, 0, width, height);
    
    // Debug: Check nếu canvas trống
    const imageData = ctx.getImageData(0, 0, width, height);
    const hasPixels = imageData.data.some(byte => byte !== 0);
    if (!hasPixels) {
      console.warn("⚠️ Canvas captured blank frame - video may not be rendering");
    }
    
    return canvas;
  }

  async function handleCameraScan() {
    if (!cameraOn) {
      setCameraError("Hãy bật camera trước khi quét.");
      return;
    }

    // Kiểm tra video có sẵn sàng không
    if (!videoRef.current || videoRef.current.videoWidth === 0) {
      setCameraError("Camera chưa sẵn sàng. Hãy đợi vài giây và thử lại.");
      return;
    }

    setIsScanning(true);
    setCameraError("");
    setScanHint("");

    try {
      const canvas = await captureFrame();
      const worker = await initWorker();
      const { data } = await worker.recognize(canvas, "eng");
      const plate = extractPlateFromText(data.text || "");

      if (!plate) {
        setCameraError("Không nhận diện được biển số. Hãy thử lại hoặc nhập thủ công.");
        return;
      }

      onScanPlateChange(plate);
      setScanHint(`Biển số nhận diện: ${plate}`);
      await onScan(plate);
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : "Quét biển số thất bại.");
    } finally {
      setIsScanning(false);
    }
  }

  async function handleScan() {
    const plate = scanPlate.trim().toUpperCase();
    if (!plate) return;
    setIsScanning(true);
    setCameraError("");
    setScanHint("");
    try {
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
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {!cameraOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 bg-gray-100/90 dark:bg-[#0A0A0A]/90">
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
      {scanHint && <p className="text-xs text-green-600 mb-2">{scanHint}</p>}

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={cameraOn ? stopCamera : startCamera}
          disabled={disabled || isScanning}
          className="flex-1 border border-gray-200 dark:border-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          {cameraOn ? "Tắt camera" : "Bật camera"}
        </button>
        <button
          type="button"
          onClick={handleCameraScan}
          disabled={disabled || !cameraOn || isScanning}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl transition-all disabled:opacity-50"
        >
          Quét camera
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
        {isScanning ? "Đang quét..." : "Xử lý biển số"}
      </motion.button>
    </div>
  );
}
