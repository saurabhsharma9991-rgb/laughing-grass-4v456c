import React from "react";

export default function Tag({ children, green }) {
  return (
    <span
      className={`inline-block text-[11px] px-2.5 py-1 rounded-full border-[0.5px] border-solid ${
        green 
          ? "bg-green-light border-green-medium text-green-dark" 
          : "bg-[#f1efe8] border-[rgba(0,0,0,0.09)] text-muted"
      }`}
    >
      {children}
    </span>
  );
}
