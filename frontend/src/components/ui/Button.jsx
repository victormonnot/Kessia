import { forwardRef } from "react";

import { Button as ShadButton } from "@/components/ui/button";

// Compatibility wrapper: keeps the v1 public API (default export, variant names
// primary/secondary/outline/danger/ghost, sizes sm/md/lg, default type="button")
// on top of the shadcn Button. Lets every existing call site stay untouched.
const variantMap = {
  primary: "default",
  secondary: "secondary",
  outline: "outline",
  danger: "destructive",
  ghost: "ghost",
  link: "link",
};

const sizeMap = { sm: "sm", md: "default", lg: "lg", icon: "icon" };

const Button = forwardRef(function Button(
  { variant = "primary", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <ShadButton
      ref={ref}
      type={type}
      variant={variantMap[variant] ?? variant}
      size={sizeMap[size] ?? size}
      {...props}
    />
  );
});

export default Button;
