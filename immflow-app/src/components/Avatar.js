import React from "react";

export default function Avatar({ initials, bg, fg, photoUrl, size = "md" }) {
  const sizeClass = size === "lg" ? "w-20 h-20 text-xl" : size === "sm" ? "w-9 h-9 text-xs" : "w-11 h-11 text-sm";

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        className={`${sizeClass} rounded-full object-cover shrink-0 border border-[rgba(0,0,0,0.08)]`}
      />
    );
  }

  const customStyles = {};
  if (bg) customStyles.backgroundColor = bg;
  if (fg) customStyles.color = fg;

  return (
    <div
      style={customStyles}
      className={`${sizeClass} rounded-full flex items-center justify-center font-semibold shrink-0 ${
        !bg ? "bg-green-light" : ""
      } ${!fg ? "text-green-dark" : ""}`}
    >
      {initials}
    </div>
  );
}
