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
  const [scanHint, setScanHint] = useState("");
  const scanningRef = useRef(false);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function getCameraStream() {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
        },
        audio: false,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      console.warn("⚠️ Không mở được camera với facingMode=environment, fallback sang camera mặc định:", msg);
      return navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
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

  function formatRawPlate(raw: string): string | null {
    if (!raw) return null;
    
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    
    // Khớp biển số Việt Nam:
    // Nhóm 1: 2 chữ số mã tỉnh
    // Nhóm 2: phần chữ/mã hiệu loại xe (1 đến 3 ký tự chữ + số, vd: A, E1, AA, B1, F)
    // Nhóm 3: phần dãy số (4 hoặc 5 chữ số)
    const match = cleaned.match(/^([0-9]{2})([A-Z]{1,3}[0-9]?|[A-Z0-9]{1,3})([0-9]{4,5})$/);
    
    if (!match) {
      return cleaned; // Nếu không khớp định dạng chuẩn thì trả về kết quả dọn dẹp ban đầu
    }
    
    const province = match[1];
    let vehicleClass = match[2];
    let sequence = match[3];

    // Định dạng lại dãy số: chèn dấu chấm nếu có 5 số (vd: 12345 -> 123.45)
    if (sequence.length === 5 && !sequence.includes(".")) {
      sequence = sequence.slice(0, 3) + "." + sequence.slice(3);
    }
    
    return `${province}${vehicleClass}-${sequence}`;
  }

  function preprocessImage(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // 1. Tính toán độ sáng trung bình để làm ngưỡng nhị phân động (Adaptive Threshold)
    let sumBrightness = 0;
    const pixelCount = width * height;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Độ sáng xám BT.601
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      sumBrightness += gray;
    }

    const averageBrightness = sumBrightness / pixelCount;
    // Đảm bảo ngưỡng không quá tối hoặc quá sáng (giới hạn trong khoảng 90 - 160)
    const threshold = Math.max(90, Math.min(averageBrightness, 160));

    // 2. Thực hiện lọc ảnh: Chuyển xám, Tăng tương phản và Nhị phân hóa
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      let gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Tăng tương phản nhẹ (C = 50)
      const C = 50;
      const factor = (259 * (C + 255)) / (255 * (259 - C));
      gray = factor * (gray - 128) + 128;

      // Nhị phân hóa: Nếu độ sáng lớn hơn ngưỡng -> chuyển thành Trắng, ngược lại thành Đen
      const finalColor = gray >= threshold ? 255 : 0;

      data[i] = finalColor;     // R
      data[i + 1] = finalColor; // G
      data[i + 2] = finalColor; // B
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
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

    // Áp dụng tiền xử lý hình ảnh
    preprocessImage(canvas);

    return canvas;
  }

  async function handleCameraScan() {
    if (!cameraOn) {
      setCameraError("Hãy bật camera trước khi quét.");
      return;
    }

    if (scanningRef.current || isScanning) {
      return; // Chặn click liên tục (throttle)
    }

    // Kiểm tra video có sẵn sàng không
    if (!videoRef.current || videoRef.current.videoWidth === 0) {
      setCameraError("Camera chưa sẵn sàng. Hãy đợi vài giây và thử lại.");
      return;
    }

    const token = import.meta.env.VITE_PLATE_RECOGNIZER_TOKEN;
    if (!token || token === "your_free_token_here") {
      setCameraError("Chưa cấu hình API Token cho ALPR. Vui lòng cấu hình VITE_PLATE_RECOGNIZER_TOKEN trong file .env!");
      return;
    }

    scanningRef.current = true;
    setIsScanning(true);
    setCameraError("");
    setScanHint("");

    try {
      const canvas = await captureFrame();
      
      // Chuyển Canvas thành Blob dạng JPEG
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9);
      });

      if (!blob) {
        throw new Error("Không thể chuyển đổi dữ liệu hình ảnh.");
      }

      // Tạo FormData để gửi lên Plate Recognizer API
      const formData = new FormData();
      formData.append("upload", blob, "plate.jpg");
      formData.append("regions", "vn"); // Tối ưu riêng cho biển số Việt Nam

      // Gọi API nhận diện biển số xe chuyên dụng
      const response = await fetch("https://api.platerecognizer.com/v1/plate-reader/", {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.detail || `Lỗi kết nối API ALPR (Mã lỗi ${response.status}).`;
        throw new Error(errMsg);
      }

      const data = await response.json();
      const results = data.results || [];

      if (results.length === 0) {
        setCameraError("Không phát hiện được biển số xe nào trong ảnh.");
        return;
      }

      // Lấy biển số thô được trả về (Plate Recognizer trả về viết liền thường, vd: "89e118896")
      const rawPlate = results[0].plate || "";
      const plate = formatRawPlate(rawPlate);

      if (!plate) {
        setCameraError("Biển số nhận diện không đúng định dạng Việt Nam.");
        return;
      }

      onScanPlateChange(plate);
      setScanHint(`Biển số nhận diện (ALPR): ${plate}`);
      await onScan(plate);
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : "Quét biển số thất bại.");
    } finally {
      setIsScanning(false);
      scanningRef.current = false;
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
