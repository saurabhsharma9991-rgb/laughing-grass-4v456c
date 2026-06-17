import React from "react";

export default function Avatar({ initials, bg, fg }) {
  const customStyles = {};
  if (bg) customStyles.backgroundColor = bg;
  if (fg) customStyles.color = fg;

  return (
    <div
      style={customStyles}
      className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
        !bg ? "bg-green-light" : ""
      } ${
        !fg ? "text-green-dark" : ""
      }`}
    >
      {initials}
    </div>
  );
}
