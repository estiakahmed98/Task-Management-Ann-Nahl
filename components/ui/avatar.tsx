"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";
import { getInitialsFromParts, getInitialsFromName, nameToColor } from "@/utils/avatar";

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  // If no src provided, don't render the Image at all so the Fallback shows
  const src = (props as any)?.src as string | undefined;
  if (!src || !String(src).trim()) return null;
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  );
}

type AvatarFallbackProps = React.ComponentProps<typeof AvatarPrimitive.Fallback> & {
  name?: string;
  firstName?: string;
  lastName?: string;
};

function AvatarFallback({
  className,
  style,
  children,
  name,
  firstName,
  lastName,
  ...props
}: AvatarFallbackProps) {
  const label = (name ?? `${firstName ?? ""} ${lastName ?? ""}`).trim();
  const computedInitials = firstName || lastName
    ? getInitialsFromParts(firstName, lastName)
    : getInitialsFromName(label);
  const content = children ?? computedInitials ?? "";
  const colorKey = label || (typeof content === "string" ? content : "user");
  const backgroundColor = nameToColor(String(colorKey));

  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full font-semibold text-white",
        className
      )}
      style={{ backgroundColor, ...style }}
      {...props}
    >
      {content}
    </AvatarPrimitive.Fallback>
  );
}

export { Avatar, AvatarImage, AvatarFallback };
