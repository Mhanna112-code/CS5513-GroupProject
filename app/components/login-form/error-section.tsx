"use client";

import { useFormStatus } from "react-dom";

export function LoginFormErrorSection() {
  const formStatus = useFormStatus();
  return <>{JSON.stringify(formStatus)}</>;
}
