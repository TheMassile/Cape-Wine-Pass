"use client";

type Props = {
  message: string;
  show: boolean;
  tone?: "success" | "error" | "info";
};

export default function Toast({
  message,
  show,
  tone = "info",
}: Props) {
  if (!show || !message) return null;

  const toneClasses =
    tone === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : tone === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-gray-200 bg-white text-gray-800";

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${toneClasses}`}
      >
        {message}
      </div>
    </div>
  );
}