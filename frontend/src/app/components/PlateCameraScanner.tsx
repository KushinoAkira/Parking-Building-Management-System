import { useEffect, useRef, useState } from "react";

import { Camera, ScanLine, Upload } from "lucide-react";

import { motion, AnimatePresence } from "motion/react";

import { recognizePlateFromVideo, recognizePlateFromFile, preloadOcrWorker, whenOcrReady, waitForVideoReady, normalizePlateDisplay } from "../lib/licensePlateOcr";
import {
  isPlateRecognizerConfigured,
  captureVideoFrame,
  canvasToJpegBlob,
  recognizePlateFromBlob,
  recognizePlateFromFileViaApi,
} from "../lib/plateRecognizer";

import { useLocale } from "../lib/i18n/LocaleContext";



type Props = {
  authToken: string;
  disabled?: boolean;
  onScan: (plate: string) => void | Promise<void> | boolean | Promise<boolean>;
  scanPlate: string;
  onScanPlateChange: (value: string) => void;
};

export function PlateCameraScanner({ authToken, disabled, onScan, scanPlate, onScanPlateChange }: Props) {

  const { t } = useLocale();

  const videoRef = useRef<HTMLVideoElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const alprEnabled = isPlateRecognizerConfigured();

  const [cameraOn, setCameraOn] = useState(false);

  const [isScanning, setIsScanning] = useState(false);

  const [cameraError, setCameraError] = useState("");

  const [ocrStatus, setOcrStatus] = useState("");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [modelLoading, setModelLoading] = useState(false);

  const [pendingPlate, setPendingPlate] = useState<string | null>(null);

  const [backendOcrState, setBackendOcrState] = useState<"loading" | "ready" | "failed">("loading");
  const scanEngine = alprEnabled ? "alpr" : backendOcrState;
  const scanReady = alprEnabled || backendOcrState === "ready";
  const ocrReady = scanReady;



  useEffect(() => {
    if (!authToken) {
      setCameraError(t("staff.plateFailed"));
      return;
    }

    if (alprEnabled) {
      setBackendOcrState("failed");
    } else {
      preloadOcrWorker(authToken)
        .then((ready) => setBackendOcrState(ready ? "ready" : "failed"))
        .catch(() => setBackendOcrState("failed"));
    }

    if (!navigator.mediaDevices?.getUserMedia) {

      setCameraError(t("staff.cameraPermission"));

      return;

    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [authToken]);



  function stopCamera() {

    streamRef.current?.getTracks().forEach((t) => t.stop());

    streamRef.current = null;

    setCameraOn(false);

  }



  async function openWebcam(constraints: MediaStreamConstraints): Promise<MediaStream> {
    return Promise.race([
      navigator.mediaDevices.getUserMedia(constraints),
      new Promise<MediaStream>((_, reject) =>
        setTimeout(() => reject(new Error("camera-timeout")), 12_000),
      ),
    ]);
  }

  async function getCameraStream(): Promise<MediaStream> {
    try {
      return await openWebcam({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
        },
        audio: false,
      });
    } catch {
      return openWebcam({
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    }
  }

  async function attachStream(stream: MediaStream) {
    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      if (video.videoWidth > 0) video.play().catch(() => {});
    };
    try {
      await video.play();
    } catch {
      /* autoplay may be blocked briefly */
    }
    setCameraOn(true);
  }

  async function startCamera() {
    if (streamRef.current) return;

    setCameraError("");
    stopCamera();

    try {
      const stream = await getCameraStream();
      await attachStream(stream);
      if (authToken) preloadOcrWorker(authToken);
    } catch (err) {
      if (err instanceof Error && err.message === "camera-timeout") {
        setCameraError(t("staff.cameraTimeout"));
      } else {
        setCameraError(t("staff.cameraPermission"));
      }
      stopCamera();
    }
  }



  async function applyOcrResult(plate: string | null, previewUrl: string) {
    setPreviewUrl(previewUrl);
    if (plate) {
      onScanPlateChange(plate);
      setPendingPlate(plate);
      setOcrStatus(t("staff.ocrDetected", { plate }));
      setCameraError("");
    } else {
      setPendingPlate(null);
      onScanPlateChange("");
      setOcrStatus("");
      setCameraError(t("staff.ocrNoPlate"));
    }
  }

  async function runLocalOcrFromVideo(video: HTMLVideoElement) {
    if (!scanReady) {
      const ready = await whenOcrReady();
      setBackendOcrState(ready ? "ready" : "failed");
    }
    setModelLoading(false);
    const { plate, previewUrl: captured } = await recognizePlateFromVideo(video, authToken);
    await applyOcrResult(plate, captured);
  }

  async function handleScan() {
    if (!videoRef.current || !cameraOn) {
      setCameraError(t("staff.cameraHint"));
      return;
    }
    if (scanningRef.current || isScanning) return;

    scanningRef.current = true;
    setIsScanning(true);
    setModelLoading(!alprEnabled && !ocrReady);
    setOcrStatus(
      alprEnabled ? t("staff.scanAlpr") : ocrReady ? t("staff.scanProcessing") : t("staff.scanModelLoad"),
    );
    setCameraError("");

    try {
      await waitForVideoReady(videoRef.current);

      if (alprEnabled) {
        try {
          const canvas = captureVideoFrame(videoRef.current);
          const blob = await canvasToJpegBlob(canvas);
          const plate = await recognizePlateFromBlob(blob);
          if (plate) {
            await applyOcrResult(plate, canvas.toDataURL("image/jpeg"));
            return;
          }
        } catch (alprErr) {
          console.warn("Plate Recognizer failed, falling back to local OCR:", alprErr);
        }
      }

      setOcrStatus(t("staff.scanProcessing"));
      setModelLoading(!ocrReady);
      await runLocalOcrFromVideo(videoRef.current);
    } catch (e) {
      setPendingPlate(null);
      setOcrStatus("");
      setCameraError(e instanceof Error ? e.message : t("staff.plateFailed"));
    } finally {
      scanningRef.current = false;
      setModelLoading(false);
      setIsScanning(false);
    }
  }



  async function handleUploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || disabled || isScanning || scanningRef.current) return;

    scanningRef.current = true;
    setIsScanning(true);
    setModelLoading(!alprEnabled && !ocrReady);
    setOcrStatus(t("staff.scanProcessing"));
    setCameraError("");

    try {
      if (alprEnabled) {
        try {
          const plate = await recognizePlateFromFileViaApi(file);
          if (plate) {
            const preview = URL.createObjectURL(file);
            await applyOcrResult(plate, preview);
            return;
          }
        } catch (alprErr) {
          console.warn("Plate Recognizer upload failed, falling back:", alprErr);
        }
      }

      if (!scanReady) {
        const ready = await whenOcrReady();
        setBackendOcrState(ready ? "ready" : "failed");
      }

      const { plate, previewUrl: captured } = await recognizePlateFromFile(file, authToken);
      await applyOcrResult(plate, captured);
    } catch (err) {
      setPendingPlate(null);
      setOcrStatus("");
      setCameraError(err instanceof Error ? err.message : t("staff.plateFailed"));
    } finally {
      scanningRef.current = false;
      setModelLoading(false);
      setIsScanning(false);
    }
  }



  async function handleConfirm() {

    if (!pendingPlate || disabled || isScanning) return;

    setIsScanning(true);

    setCameraError("");

    try {

      const ok = await onScan(pendingPlate);

      if (ok !== false) setPendingPlate(null);

    } catch (e) {

      setCameraError(e instanceof Error ? e.message : t("staff.plateFailed"));

    } finally {

      setIsScanning(false);

    }

  }



  return (

    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">

      <div className="flex justify-between items-center mb-4">

        <h2 className="font-bold text-gray-900 dark:text-white">{t("staff.cameraTitle")}</h2>

        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
            scanEngine === "alpr" || scanEngine === "ready"
              ? "text-green-600 bg-green-600/10 border-green-600/20"
              : scanEngine === "failed"
                ? "text-red-600 bg-red-600/10 border-red-600/20"
                : "text-amber-600 bg-amber-600/10 border-amber-600/20"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              scanEngine === "alpr" || scanEngine === "ready"
                ? "bg-green-600"
                : scanEngine === "failed"
                  ? "bg-red-600"
                  : "bg-amber-600 animate-pulse"
            }`} />
            {scanEngine === "alpr"
              ? t("staff.alprReady")
              : scanEngine === "ready"
                ? t("staff.ocrReady")
                : scanEngine === "failed"
                  ? t("staff.ocrUnavailable")
                  : t("staff.scanModelLoad")}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-600/10 px-2.5 py-1 rounded-full border border-blue-600/20">
            <span className={`w-1.5 h-1.5 rounded-full bg-blue-600 ${cameraOn ? "animate-pulse" : "opacity-40"}`} />
            {cameraOn ? t("staff.cameraWebcam") : t("staff.cameraOff")}
          </span>
          {alprEnabled && (
            <span className="text-xs font-semibold text-violet-600 bg-violet-600/10 px-2.5 py-1 rounded-full border border-violet-600/20">
              ALPR
            </span>
          )}
        </div>

      </div>



      <div className="relative aspect-video bg-gray-100 dark:bg-[#0A0A0A] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 mb-3">

        <video

          ref={videoRef}

          className={`absolute inset-0 w-full h-full object-cover ${cameraOn ? "opacity-100" : "opacity-0"}`}

          playsInline

          muted

        />

        {!cameraOn && (

          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">

            <Camera className="w-10 h-10 mb-2 opacity-40" />

            <p className="text-xs px-4 text-center">{t("staff.cameraOpening")}</p>

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

              <p className="text-white text-sm font-semibold px-4 text-center">

                {modelLoading ? t("staff.scanModelLoad") : t("staff.scanProcessing")}

              </p>

              <motion.div

                className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"

                animate={{ top: ["25%", "75%", "25%"] }}

                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}

              />

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



      {previewUrl && (

        <div className="mb-3 flex items-center gap-3">

          <img src={previewUrl} alt={t("staff.ocrPreview")} className="w-20 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />

          <p className="text-xs text-gray-500 dark:text-gray-400">{t("staff.ocrPreview")}</p>

        </div>

      )}



      {cameraError && <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 break-words">{cameraError}</p>}

      {ocrStatus && !cameraError && <p className="text-xs text-green-600 dark:text-green-400 mb-2">{ocrStatus}</p>}



      <div className="flex gap-2 mb-3">

        <button

          type="button"

          onClick={cameraOn ? stopCamera : startCamera}

          disabled={disabled || isScanning}

          className="flex-1 border border-gray-200 dark:border-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"

        >

          {cameraOn ? t("staff.turnOffWebcam") : t("staff.turnOnWebcam")}

        </button>

      </div>



      <input

        type="text"

        placeholder={t("staff.plateAutoFill")}

        value={scanPlate}

        onChange={(e) => onScanPlateChange(e.target.value.toUpperCase())}

        onBlur={(e) => onScanPlateChange(normalizePlateDisplay(e.target.value))}

        className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm uppercase mb-3"

      />



      <motion.button

        whileHover={{ scale: 1.01 }}

        whileTap={{ scale: 0.99 }}

        type="button"

        onClick={handleScan}

        disabled={disabled || isScanning || !cameraOn}

        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-md shadow-blue-500/20"

      >

        <ScanLine className="w-5 h-5" />

        {isScanning ? t("staff.scanning") : t("staff.scanAi")}

      </motion.button>



      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} />



      <button

        type="button"

        onClick={() => fileInputRef.current?.click()}

        disabled={disabled || isScanning}

        className="w-full mt-2 border border-gray-200 dark:border-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 flex justify-center items-center gap-2"

      >

        <Upload className="w-4 h-4" />

        {t("staff.uploadPlatePhoto")}

      </button>



      {pendingPlate && (

        <motion.button

          whileHover={{ scale: 1.01 }}

          whileTap={{ scale: 0.99 }}

          type="button"

          onClick={handleConfirm}

          disabled={disabled || isScanning}

          className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50"

        >

          {t("staff.confirmCheckIn")}

        </motion.button>

      )}



      <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">

        {t("staff.ocrTip")}

      </p>

    </div>

  );

}

