"use client";

import { useEffect } from "react";

/**
 * Browsers localize native HTML5 constraint-validation messages to the user's
 * own locale (so a Czech browser shows "musí obsahovat zavináč"), regardless of
 * the page's lang. This forces those messages to English site-wide by setting a
 * custom validity message on any field that fails validation, cleared as soon as
 * the user edits it.
 */
function englishMessage(el: HTMLInputElement): string {
  const v = el.validity;
  const type = el.type;
  if (v.valueMissing) {
    if (type === "checkbox" || type === "radio") return "Please check this box to continue.";
    if (type === "email") return "Please enter your email address.";
    return "Please fill out this field.";
  }
  if (v.typeMismatch) {
    if (type === "email") return "Please enter a valid email address (including an @).";
    if (type === "url") return "Please enter a valid URL.";
    return "Please enter a valid value.";
  }
  if (v.tooShort) return `Please use at least ${el.minLength} characters.`;
  if (v.tooLong) return `Please use ${el.maxLength} characters or fewer.`;
  if (v.patternMismatch) return el.title || "Please match the requested format.";
  if (v.rangeUnderflow) return `Value must be at least ${el.min}.`;
  if (v.rangeOverflow) return `Value must be at most ${el.max}.`;
  if (v.stepMismatch || v.badInput) return "Please enter a valid value.";
  return "Please enter a valid value.";
}

export default function ForceEnglishValidation() {
  useEffect(() => {
    const onInvalid = (e: Event) => {
      const el = e.target as HTMLInputElement;
      if (el && typeof el.setCustomValidity === "function") el.setCustomValidity(englishMessage(el));
    };
    // Clear the custom message once the user edits, so the field can re-validate.
    const onEdit = (e: Event) => {
      const el = e.target as HTMLInputElement;
      if (el && typeof el.setCustomValidity === "function") el.setCustomValidity("");
    };
    // `invalid` doesn't bubble — listen in the capture phase.
    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("input", onEdit, true);
    document.addEventListener("change", onEdit, true);
    return () => {
      document.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("input", onEdit, true);
      document.removeEventListener("change", onEdit, true);
    };
  }, []);

  return null;
}
