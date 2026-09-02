"use client";

import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { RotateCcw, RotateCw, X } from "lucide-react";

type Props = {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
  saving: boolean;
};

function getRadianAngle(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// The rotated bounding box must match react-easy-crop's own internal math
// (width/height rotate independently) — a plain square (diagonal x diagonal)
// throws off the crop coordinates it hands back, which is what was causing
// the wrong region to be cropped.
function rotatedBoxSize(width: number, height: number, rotation: number) {
  const rad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

// Draws the cropped + rotated region onto a canvas and returns it as a Blob.
async function getCroppedBlob(imageSrc: string, cropArea: Area, rotation: number): Promise<Blob> {
  const image = new window.Image();
  image.src = imageSrc;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const rad = getRadianAngle(rotation);
  const { width: boxWidth, height: boxHeight } = rotatedBoxSize(image.width, image.height, rotation);

  // Canvas sized exactly to the rotated bounding box (not a square) —
  // this is what keeps it in sync with the crop coordinates from the library.
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = boxWidth;
  sourceCanvas.height = boxHeight;
  const sourceCtx = sourceCanvas.getContext("2d")!;

  sourceCtx.translate(boxWidth / 2, boxHeight / 2);
  sourceCtx.rotate(rad);
  sourceCtx.translate(-image.width / 2, -image.height / 2);
  sourceCtx.drawImage(image, 0, 0);

  // Crop the requested area out of the rotated canvas into the final canvas.
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = cropArea.width;
  outputCanvas.height = cropArea.height;
  const outputCtx = outputCanvas.getContext("2d")!;

  outputCtx.drawImage(
    sourceCanvas,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height
  );

  return new Promise((resolve, reject) => {
    outputCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))),
      "image/jpeg",
      0.92
    );
  });
}

export default function AvatarCropModal({ imageSrc, onCancel, onConfirm, saving }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, rotation);
    onConfirm(blob);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Adjust photo</h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative h-72 w-full overflow-hidden rounded-xl bg-slate-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-slate-900"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-500">Rotate</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !croppedAreaPixels}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save photo"}
          </button>
        </div>
      </div>
    </div>
  );
}